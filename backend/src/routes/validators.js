const express = require('express');
const router = express.Router();

// Minimal validators API to power frontend Validators page
router.get('/', async (req, res) => {
  try {
    const validators = [
      {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Validator Alpha',
        status: 'active',
        stake: 1000000,
        commission: 5.0,
        uptime: 99.8,
        blocksProduced: 1250,
        rewards: 45000,
        rank: 1
      },
      {
        id: 2,
        address: '0x2345678901bcdef2345678901bcdef2345678901',
        name: 'Validator Beta',
        status: 'active',
        stake: 850000,
        commission: 4.5,
        uptime: 99.5,
        blocksProduced: 1180,
        rewards: 38000,
        rank: 2
      },
      {
        id: 3,
        address: '0x3456789012cdef3456789012cdef3456789012cd',
        name: 'Validator Gamma',
        status: 'active',
        stake: 720000,
        commission: 6.0,
        uptime: 98.9,
        blocksProduced: 1050,
        rewards: 32000,
        rank: 3
      },
      {
        id: 4,
        address: '0x4567890123def4567890123def4567890123def4',
        name: 'Validator Delta',
        status: 'inactive',
        stake: 500000,
        commission: 7.0,
        uptime: 85.2,
        blocksProduced: 750,
        rewards: 15000,
        rank: 4
      },
      {
        id: 5,
        address: '0x5678901234ef5678901234ef5678901234ef5678',
        name: 'Validator Epsilon',
        status: 'active',
        stake: 650000,
        commission: 5.5,
        uptime: 99.2,
        blocksProduced: 920,
        rewards: 28000,
        rank: 5
      }
    ];

    const totalStake = validators.reduce((sum, v) => sum + (v.stake || 0), 0);
    res.json({ totalValidators: validators.length, totalStake, validators });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load validators' });
  }
});

module.exports = router;


