const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDatabaseUpdate() {
    console.log("🔍 Verifying Aurora database update...");
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });
    
    try {
        // Check if contract exists
        const [contractRows] = await connection.execute(
            'SELECT * FROM contracts WHERE address = ?',
            ['0x7877EFAb4aD3610792a135f6f8A241962fD2ab76']
        );
        
        if (contractRows.length > 0) {
            console.log("✅ Contract found in database:", contractRows[0]);
        } else {
            console.log("❌ Contract not found in database");
        }
        
        // Check related tables
        const tables = [
            'mining_sessions',
            'discoveries', 
            'staking_records',
            'validators',
            'research_submissions',
            'token_transfers',
            'pool_balances',
            'asymptotic_data',
            'security_metrics',
            'mathematical_complexity',
            'cross_chain_transfers'
        ];
        
        for (const table of tables) {
            try {
                const [rows] = await connection.execute(
                    `SELECT COUNT(*) as count FROM ${table} WHERE contract_address = ?`,
                    ['0x7877EFAb4aD3610792a135f6f8A241962fD2ab76']
                );
                console.log(`📊 ${table}: ${rows[0].count} records with new contract address`);
            } catch (error) {
                console.log(`⚠️  Table ${table} not found or no contract_address column`);
            }
        }
        
    } catch (error) {
        console.error("❌ Database verification failed:", error.message);
    } finally {
        await connection.end();
    }
}

verifyDatabaseUpdate()
    .then(() => {
        console.log("✅ Database verification completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
