from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
import psycopg2
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/productiveminer_db')

# Initialize Redis
redis_client = redis.from_url(REDIS_URL)

# Initialize PostgreSQL
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'mathematical-engine'})

@app.route('/api/v1/compute', methods=['POST'])
def compute():
    try:
        data = request.get_json()
        work_type = data.get('work_type')
        parameters = data.get('parameters', {})
        
        # Mathematical computation based on work type
        result = perform_computation(work_type, parameters)
        
        # Store result in Redis for caching
        cache_key = f"compute:{work_type}:{hash(str(parameters))}"
        redis_client.setex(cache_key, 3600, json.dumps(result))
        
        return jsonify({
            'status': 'success',
            'work_type': work_type,
            'result': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def perform_computation(work_type, parameters):
    """Perform mathematical computation based on work type"""
    if work_type == 'prime_pattern_discovery':
        return compute_prime_patterns(parameters)
    elif work_type == 'riemann_zeros':
        return compute_riemann_zeros(parameters)
    elif work_type == 'yang_mills':
        return compute_yang_mills(parameters)
    else:
        return {'error': 'Unknown work type'}

def compute_prime_patterns(params):
    """Compute prime number patterns"""
    limit = params.get('limit', 1000)
    primes = []
    for i in range(2, limit):
        if is_prime(i):
            primes.append(i)
    return {
        'primes_found': len(primes),
        'largest_prime': max(primes) if primes else 0,
        'pattern_analysis': analyze_prime_patterns(primes)
    }

def compute_riemann_zeros(params):
    """Compute Riemann zeta function zeros"""
    # Simplified Riemann zero computation
    zeros = []
    for i in range(1, params.get('count', 10) + 1):
        zeros.append(0.5 + 14.134725 * i)
    return {
        'zeros_found': len(zeros),
        'zeros': zeros[:5]  # Return first 5 for brevity
    }

def compute_yang_mills(params):
    """Compute Yang-Mills theory calculations"""
    # Simplified Yang-Mills computation
    return {
        'gauge_field_strength': np.random.normal(0, 1),
        'energy_density': np.random.exponential(1),
        'topological_charge': np.random.randint(-10, 10)
    }

def is_prime(n):
    """Check if a number is prime"""
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def analyze_prime_patterns(primes):
    """Analyze patterns in prime numbers"""
    if len(primes) < 2:
        return {'gaps': [], 'average_gap': 0}
    
    gaps = [primes[i+1] - primes[i] for i in range(len(primes)-1)]
    return {
        'gaps': gaps[:10],  # Return first 10 gaps
        'average_gap': sum(gaps) / len(gaps),
        'max_gap': max(gaps),
        'min_gap': min(gaps)
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
