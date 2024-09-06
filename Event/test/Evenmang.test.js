const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Evenmang Contract", function () {
  let Evenmang, evenmang, owner, addr1, addr2;

  beforeEach(async function () {
    Evenmang = await ethers.getContractFactory("Evenmang");
    [owner, addr1, addr2] = await ethers.getSigners();
    evenmang = await Evenmang.deploy();
  });

  it("should set the correct creator", async function () {
    expect(await evenmang.creator()).to.equal(owner.address);
  });

  it("should allow the creator to create an event", async function () {
    const tx = await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);
    await tx.wait();

    const event = await evenmang.events(1);
    expect(event.eventID).to.equal(1);
    expect(event.eventName).to.equal("Blockchain Conference");
    expect(event.registrationFee).to.equal(ethers.parseEther("1"));
    expect(event.maxPPL).to.equal(100);
  });

  it("should allow the creator to open registration for the event", async function () {
    await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await evenmang.openRegistration(1, deadline);

    const event = await evenmang.events(1);
    expect(event.state).to.equal(1); // State.IsOpen
  });

  it("should allow participants to register if the event is open", async function () {
    await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await evenmang.openRegistration(1, deadline);

    await expect(
      evenmang.connect(addr1).participantRegistration(1, "Alice", { value: ethers.parseEther("1") })
    ).to.changeEtherBalances([addr1, evenmang], [ethers.parseEther("-1"), ethers.parseEther("1")]);

    const event = await evenmang.events(1);
    expect(event.currentPPL).to.equal(1);
    const participants = await evenmang.getParticipants(1);
    expect(participants[0]).to.deep.equal([addr1.address]);
    expect(participants[1]).to.deep.equal(["Alice"]);
  });

  it("should revert if the registration fee is incorrect", async function () {
    await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await evenmang.openRegistration(1, deadline);

    await expect(
      evenmang.connect(addr1).participantRegistration(1, "Alice", { value: ethers.parseEther("0.5") })
    ).to.be.revertedWithCustomError(evenmang, "IncorrectRegistrationFee");
  });

  it("should revert if the event is fully booked", async function () {
  await evenmang.createEvent("Small Event", ethers.parseEther("1"), 1);

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  await evenmang.openRegistration(1, deadline);

  await evenmang.connect(addr1).participantRegistration(1, "Alice", { value: ethers.parseEther("1") });

  // Expect the second participant to revert with EventNotOpen since the event is finished
  await expect(
    evenmang.connect(addr2).participantRegistration(1, "Bob", { value: ethers.parseEther("1") })
  ).to.be.revertedWithCustomError(evenmang, "EventNotOpen");
});

  it("should allow the creator to close registration", async function () {
    await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await evenmang.openRegistration(1, deadline);

    await evenmang.connect(addr1).participantRegistration(1, "Alice", { value: ethers.parseEther("1") });
    await evenmang.connect(addr2).participantRegistration(1, "Bob", { value: ethers.parseEther("1") });

    await evenmang.closeRegistration(1);

    const event = await evenmang.events(1);
    expect(event.state).to.equal(2); // State.Finished
  });

  it("should allow the creator to withdraw payments", async function () {
    await evenmang.createEvent("Blockchain Conference", ethers.parseEther("1"), 100);

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await evenmang.openRegistration(1, deadline);

    await evenmang.connect(addr1).participantRegistration(1, "Alice", { value: ethers.parseEther("1") });

    const initialBalance = await ethers.provider.getBalance(owner.address);

    const tx = await evenmang.withdrawPayments(ethers.parseEther("1"));
    await tx.wait();

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });
});
