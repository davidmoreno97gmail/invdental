#!/usr/bin/env bash
set -euo pipefail
BASE=http://localhost:4000

echo "GET products"
curl -sS "$BASE/api/products" | jq .

echo "POST product"
curl -sS -X POST "$BASE/api/products" -H 'Content-Type: application/json' -d '{"nombre":"Test","cantidad":5}' | jq .

echo "GET products after create"
curl -sS "$BASE/api/products" | jq .

echo "DELETE product id=1"
curl -sS -X DELETE "$BASE/api/products/1" | jq .

echo "GET products after delete"
curl -sS "$BASE/api/products" | jq .
