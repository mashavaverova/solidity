const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory for "FilmVoting"
  const FilmVoting = await ethers.getContractFactory("FilmVoting");

  console.log("Deploying the contract...");

  // Deploy the contract without any arguments since the constructor does not take any
  const filmVoting = await FilmVoting.deploy();

  // Wait for the deployment to be mined
  await filmVoting.waitForDeployment();

  // Log the deployed contract's address
  console.log("Contract deployed to address:", await filmVoting.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
