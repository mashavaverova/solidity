const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Notes Contract", function () {
  let Notes, notesContract, owner, addr1, addr2;

  beforeEach(async function () {
    Notes = await ethers.getContractFactory("Notes");
    [owner, addr1, addr2] = await ethers.getSigners();
    notesContract = await Notes.deploy(); // Deploy the contract before each test
  });

  it("should allow the owner to create a note", async function () {
    await notesContract.createNote("My Note", "This is a test note", true, [addr1.address]);
    const userNotes = await notesContract.getUserNotes(owner.address);

    expect(userNotes.length).to.equal(1); // The owner should have one note
  });

  it("should allow a user to read their own public note", async function () {
    await notesContract.createNote("My Note", "This is a test note", true, [addr1.address]);
    const userNotes = await notesContract.getUserNotes(owner.address);
    const noteId = userNotes[0];

    const [title, content, dateOfCreation] = await notesContract.readNote(noteId);

    expect(title).to.equal("My Note");
    expect(content).to.equal("This is a test note");
    expect(typeof dateOfCreation).to.equal("bigint"); // Ensure it's BigInt
  });

  it("should prevent others from reading a private note", async function () {
    await notesContract.createNote("Private Note", "This is private", false, []);
    const userNotes = await notesContract.getUserNotes(owner.address);
    const noteId = userNotes[0];

    await expect(notesContract.connect(addr1).readNote(noteId)).to.be.revertedWith("Access Denied");
  });

  it("should allow shared users to read a private note", async function () {
    await notesContract.createNote("Shared Note", "This is a shared note", false, [addr1.address]);
    const userNotes = await notesContract.getUserNotes(owner.address);
    const noteId = userNotes[0];

    const [title, content] = await notesContract.connect(addr1).readNote(noteId);
    expect(title).to.equal("Shared Note");
    expect(content).to.equal("This is a shared note");
  });

  it("should allow the owner to update sharing settings", async function () {
    await notesContract.createNote("My Note", "This is a test note", false, [addr1.address]);
    const userNotes = await notesContract.getUserNotes(owner.address);
    const noteId = userNotes[0];

    await notesContract.updateSharingSettings(noteId, true, [addr2.address]);

    const [title, content] = await notesContract.connect(addr2).readNote(noteId);
    expect(title).to.equal("My Note");
    expect(content).to.equal("This is a test note");
  });

  it("should allow the owner to delete a note", async function () {
    await notesContract.createNote("Note to delete", "Delete this note", true, []);
    const userNotesBefore = await notesContract.getUserNotes(owner.address);
    const noteId = userNotesBefore[0];

    await notesContract.deleteNote(noteId);

    const userNotesAfter = await notesContract.getUserNotes(owner.address);
    expect(userNotesAfter.length).to.equal(0);
  });

  it("should prevent non-owners from deleting a note", async function () {
    await notesContract.createNote("Protected Note", "Cannot delete", true, []);
    const userNotes = await notesContract.getUserNotes(owner.address);
    const noteId = userNotes[0];

    await expect(notesContract.connect(addr1).deleteNote(noteId)).to.be.revertedWith("Only the owner can delete this note");
  });

  it("should pause and resume the contract by the owner", async function () {
    await notesContract.pauseContract();

    await expect(
      notesContract.createNote("Paused Note", "This should not work", true, [])
    ).to.be.revertedWithCustomError(notesContract, "ContractPaused");

    await notesContract.resumeContract();

    await notesContract.createNote("Working Note", "This should work", true, []);
    const userNotes = await notesContract.getUserNotes(owner.address);

    expect(userNotes.length).to.equal(1);
  });

  it("should prevent non-owners from pausing the contract", async function () {
    await expect(notesContract.connect(addr1).pauseContract())
      .to.be.revertedWithCustomError(notesContract, "NotOwner");
  });
});
