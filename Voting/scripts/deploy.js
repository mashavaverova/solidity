async function main() {
  const FilmVoting = await ethers.getContractFactory("FilmVoting");

  const movies = ["Movie 1", "Movie 2", "Movie 3"];
  const votingDuration = 3600; // 1 hour

  console.log("Deploying the contract...");

  const filmVoting = await FilmVoting.deploy(movies, votingDuration);

  await filmVoting.deployed();

  console.log("Contract deployed to address:", filmVoting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
