const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory for "Evenmang"
  const Evenmang = await ethers.getContractFactory("Evenmang");

  console.log("Deploying the contract...");

  // Deploy the contract (Evenmang constructor takes no arguments)
  const evenmang = await Evenmang.deploy();

  // Wait for the deployment to be mined
  await evenmang.waitForDeployment();

  // Log the deployed contract's address
  console.log("Contract deployed to address:", await evenmang.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
