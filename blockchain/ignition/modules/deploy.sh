#!/bin/sh

# Exit on any error
set -e

# Function to display usage information
usage() {
  echo "Usage: $0 [-n <network>] [-r <reset>]"
  echo "  -n <network>   Specify the network to deploy to (Supported values - localhost, development, sepolia)"
  echo "  -r <reset>     Specify whether to reset (true or false)"
  exit 1
}
# Parse command-line arguments
while getopts "n:r:" opt; do
  case ${opt} in
    n )
      NETWORK=$OPTARG
      ;;
    r )
      RESET=$OPTARG
      ;;
    * )
      usage
      ;;
  esac
done

# Check if network is provided
if [ -z "$NETWORK" ]; then
  usage
fi

# Prepare reset option
RESET_OPTION=""
if [ "$RESET" = "true" ]; then
  RESET_OPTION="--reset"
fi

echo "Deploying to network: $NETWORK with reset: $RESET_OPTION"

# Deploy Libraries
npx hardhat ignition deploy ignition/modules/1_Deploy_Libraries.js --network $NETWORK $RESET_OPTION

# Deploy Contracts
npx hardhat ignition deploy ignition/modules/2_Deploy_Contracts.js --network $NETWORK $RESET_OPTION

# Link Contracts
npx hardhat ignition deploy ignition/modules/3_Link_Contracts.js --network $NETWORK $RESET_OPTION

# Create Default Users with Roles (Shipper, Receiver, Driver-1, Driver-2, Driver-3)
npx hardhat ignition deploy ignition/modules/4_Default_User_Roles.js --network $NETWORK $RESET_OPTION

echo "Deployment complete!"