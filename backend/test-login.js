// Test script to verify login functionality
import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('Testing login functionality...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'blakerusspiner2@gmail.com',
        password: 'testpassword123' // This should be the actual password
      })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.status === 200) {
      console.log('✅ Login test successful!');
    } else if (response.status === 401) {
      console.log('⚠️ Login failed with invalid credentials (expected if password is wrong)');
    } else if (response.status === 500) {
      console.log('❌ Login failed with internal server error - the prepared statement issue persists');
    } else {
      console.log('ℹ️ Login returned status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

testLogin();

