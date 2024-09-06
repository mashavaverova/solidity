const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FilmVoting Contract", function () {
  let FilmVoting;
  let filmVoting;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Deploy the contract before each test
    FilmVoting = await ethers.getContractFactory("FilmVoting");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    filmVoting = await FilmVoting.deploy();
    await filmVoting.deployed();
  });

  it("Should create a voting session and emit VotingCreated event", async function () {
    const movies = ["Inception", "Avatar", "Titanic"];
    const votingDuration = 3600; // 1 hour

    // Create the voting session
    await expect(filmVoting.createVoting(movies, votingDuration))
      .to.emit(filmVoting, "VotingCreated")
      .withArgs(0, (await ethers.provider.getBlock("latest")).timestamp + votingDuration);

    const votingSession = await filmVoting.votingSessions(0);
    expect(votingSession.creator).to.equal(owner.address);
  });

  it("Should start the voting session", async function () {
    const movies = ["Inception", "Avatar", "Titanic"];
    const votingDuration = 3600;

    // Create the voting session
    await filmVoting.createVoting(movies, votingDuration);

    // Start the voting session
    await expect(filmVoting.startVoting(0))
      .to.emit(filmVoting, "VotingStarted")
      .withArgs(0, (await ethers.provider.getBlock("latest")).timestamp + votingDuration);

    const votingSession = await filmVoting.votingSessions(0);
    expect(votingSession.votingState).to.equal(1); // IsOpen state
  });

  it("Should allow a user to vote and emit Voted event", async function () {
    const movies = ["Inception", "Avatar", "Titanic"];
    const votingDuration = 3600;

    // Create and start the voting session
    await filmVoting.createVoting(movies, votingDuration);
    await filmVoting.startVoting(0);

    // Vote for "Inception"
    await expect(filmVoting.connect(addr1).vote(0, "Inception"))
      .to.emit(filmVoting, "Voted")
      .withArgs(0, addr1.address, "Inception");

    // Check the vote count for "Inception"
    const movieList = await filmVoting.getMovies(0);
    expect(movieList[0].voteCount).to.equal(1);
  });

  it("Should end the voting session and declare a winner", async function () {
    const movies = ["Inception", "Avatar", "Titanic"];
    const votingDuration = 3600;

    // Create and start the voting session
    await filmVoting.createVoting(movies, votingDuration);
    await filmVoting.startVoting(0);

    // Vote for movies
    await filmVoting.connect(addr1).vote(0, "Inception");
    await filmVoting.connect(addr2).vote(0, "Avatar");

    // Simulate time passing for voting to end
    await ethers.provider.send("evm_increaseTime", [votingDuration + 1]);
    await ethers.provider.send("evm_mine");

    // End the voting session
    await expect(filmVoting.endVoting(0))
      .to.emit(filmVoting, "VotingEnded")
      .withArgs(0, "Inception", 1);

    // Check the winner
    const winner = await filmVoting.getWinner(0);
    expect(winner).to.equal("Inception");
  });

  it("Should prevent voting after the voting session has ended", async function () {
    const movies = ["Inception", "Avatar", "Titanic"];
    const votingDuration = 3600;

    // Create and start the voting session
    await filmVoting.createVoting(movies, votingDuration);
    await filmVoting.startVoting(0);

    // Simulate time passing for voting to end
    await ethers.provider.send("evm_increaseTime", [votingDuration + 1]);
    await ethers.provider.send("evm_mine");

    // End the voting session
    await filmVoting.endVoting(0);

    // Try to vote after the voting session has ended
    await expect(filmVoting.connect(addr1).vote(0, "Avatar")).to.be.revertedWith(
      "VotingStateError"
    );
  });
});
