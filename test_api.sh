#!/bin/bash
echo "Testing API endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3002/api/profesores-guardia)
echo "Response: $response"
