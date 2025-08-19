const { ethers } = require('ethers');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

class BlockchainSyncService {
    constructor() {
        this.isRunning = false;
        this.syncInterval = null;
        this.lastSyncedBlock = 0;
        this.syncCount = 0;
        
        // Configuration
        this.CONTRACT_ADDRESS = '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76';
        this.RPC_URL = 'https://sepolia.infura.io/v3/3f2349b3beef4a0f86c7a8596fef5c00';
        this.SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
        this.SYNC_INTERVAL_BLOCKS = 100; // Sync events from last 100 blocks
        
        // Initialize provider and contract
        this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
        this.contract = null;
        this.initializeContract();
    }
    
    async initializeContract() {
        try {
            const fs = require('fs');
            const path = require('path');
            const TOKEN_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../contracts/MINEDToken.json'), 'utf8')).abi;
            this.contract = new ethers.Contract(this.CONTRACT_ADDRESS, TOKEN_ABI, this.provider);
            logger.info('Blockchain sync service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize blockchain sync service:', error);
        }
    }
    
    async start() {
        if (this.isRunning) {
            logger.warn('Blockchain sync service is already running');
            return;
        }
        
        this.isRunning = true;
        logger.info('Starting blockchain sync service...');
        
        // Get last synced block
        await this.getLastSyncedBlock();
        
        // Perform initial sync
        await this.performSync();
        
        // Set up periodic sync
        this.syncInterval = setInterval(async () => {
            if (this.isRunning) {
                await this.performSync();
            }
        }, this.SYNC_INTERVAL_MS);
        
        logger.info(`Blockchain sync service started. Sync interval: ${this.SYNC_INTERVAL_MS / 1000} seconds`);
    }
    
    async stop() {
        if (!this.isRunning) {
            logger.warn('Blockchain sync service is not running');
            return;
        }
        
        this.isRunning = false;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        logger.info('Blockchain sync service stopped');
    }
    
    async getLastSyncedBlock() {
        try {
            const result = await query(`
                SELECT MAX(CAST(block_number AS BIGINT)) as last_block 
                FROM blockchain_events
            `);
            
            this.lastSyncedBlock = result.rows[0].last_block || 0;
            logger.info(`Last synced block: ${this.lastSyncedBlock}`);
        } catch (error) {
            logger.error('Failed to get last synced block:', error);
            this.lastSyncedBlock = 0;
        }
    }
    
    async performSync() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(this.lastSyncedBlock + 1, currentBlock - this.SYNC_INTERVAL_BLOCKS);
            
            if (fromBlock > currentBlock) {
                logger.debug('Database is up to date');
                return;
            }
            
            logger.info(`Syncing blocks ${fromBlock} to ${currentBlock}`);
            
            let totalEvents = 0;
            
            // Sync all event types
            const eventTypes = [
                'DiscoverySubmitted',
                'DiscoveryValidated', 
                'MathematicalDiscoveryAdded',
                'MiningSessionCompleted',
                'MiningSessionStarted'
            ];
            
            for (const eventType of eventTypes) {
                const events = await this.contract.queryFilter(eventType, fromBlock, currentBlock);
                logger.info(`Found ${events.length} new ${eventType} events`);
                
                for (const event of events) {
                    try {
                        await this.insertEvent(event, eventType);
                        totalEvents++;
                    } catch (error) {
                        logger.error(`Error syncing ${eventType} event:`, error);
                    }
                }
            }
            
            this.lastSyncedBlock = currentBlock;
            this.syncCount++;
            
            logger.info(`Sync completed. Total events: ${totalEvents}, Sync count: ${this.syncCount}`);
            
        } catch (error) {
            logger.error('Sync failed:', error);
        }
    }
    
    async insertEvent(event, eventType) {
        const baseData = {
            event_type: eventType.toUpperCase(),
            transaction_hash: event.transactionHash,
            block_number: event.blockNumber.toString(),
            log_index: event.logIndex,
            event_signature: event.topics[0],
            event_data: JSON.stringify({
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                ...event.args
            }),
            created_at: new Date()
        };
        
        let queryData = { ...baseData };
        
        // Add event-specific fields
        switch (eventType) {
            case 'DiscoverySubmitted':
                queryData.discovery_id = event.args.discoveryId.toString();
                queryData.researcher_address = event.args.discoverer;
                queryData.work_type_id = parseInt(event.args.workType.toString());
                queryData.research_value = event.args.researchValue.toString();
                break;
                
            case 'DiscoveryValidated':
                queryData.discovery_id = event.args.discoveryId.toString();
                queryData.validator_address = event.args.validator;
                queryData.consensus_reached = event.args.isValid;
                break;
                
            case 'MathematicalDiscoveryAdded':
                queryData.discovery_id = event.args.discoveryId.toString();
                queryData.complexity = event.args.complexity.toString();
                queryData.significance = event.args.significance.toString();
                break;
                
            case 'MiningSessionCompleted':
                queryData.session_id_str = event.args.sessionId.toString();
                queryData.miner = event.args.miner;
                queryData.difficulty = 25; // Default
                break;
                
            case 'MiningSessionStarted':
                queryData.session_id_str = event.args.sessionId.toString();
                queryData.miner = event.args.miner;
                queryData.work_type_id = parseInt(event.args.workType.toString());
                queryData.difficulty = parseInt(event.args.difficulty.toString());
                break;
        }
        
        // Build dynamic query
        const columns = Object.keys(queryData).join(', ');
        const values = Object.values(queryData);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const insertQuery = `
            INSERT INTO blockchain_events (${columns})
            VALUES (${placeholders})
            ON CONFLICT (transaction_hash, log_index) DO NOTHING
        `;
        
        await query(insertQuery, values);
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            syncCount: this.syncCount,
            lastSyncedBlock: this.lastSyncedBlock,
            contractAddress: this.CONTRACT_ADDRESS,
            syncInterval: this.SYNC_INTERVAL_MS
        };
    }
    
    // Expose performSync method for manual sync API
    async manualSync() {
        return await this.performSync();
    }
}

// Create singleton instance
const blockchainSyncService = new BlockchainSyncService();

module.exports = blockchainSyncService;
