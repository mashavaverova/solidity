const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  // Log the deployer address
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the Evenmang contract
  const Evenmang = await ethers.getContractFactory("Evenmang"); // Fetch contract factory
  const evenmang = await Evenmang.deploy(); // Deploy contract and wait for it to be mined

  // Wait until the contract is fully deployed and mined
  await evenmang.deployTransaction.wait();

  // Log the deployed contract address
  console.log("Evenmang contract deployed to:", evenmang.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
