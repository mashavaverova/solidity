const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  // Log the deployer's address
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the Notes contract
  const Notes = await ethers.getContractFactory("Notes");
  const notes = await Notes.deploy();

  // Wait for the contract deployment to complete
  await notes.waitForDeployment();

  // Log the address of the deployed contract
  console.log("Notes contract deployed to:", await notes.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
