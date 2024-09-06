const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  // Log the deployer address
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the Notes contract and wait for it to be mined
  const Notes = await ethers.getContractFactory("Notes");
  const notes = await Notes.deploy(); // Deploy the contract
  await notes.deployed(); // Ensure the contract is deployed and wait for the transaction to be mined

  // Log the address of the deployed contract
  console.log("Notes contract deployed to:", notes.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
