Smart Contracts Assignment: Film Voting, Event Registration, and Digital Notebook
Overview
This repository contains three smart contracts developed in Solidity to showcase key blockchain concepts like voting, event management, and note sharing. The project focuses on gas efficiency, security, and comprehensive testing. All contracts have been deployed to the Ethereum network (Sepolia) and verified on Etherscan.


//////////////////   Contracts   //////////////////


1. Film Voting Contract
Allows users to create a voting session, vote for their favorite movie, and determine the winner once voting ends.

Key Features: Create and start voting sessions, vote, and announce the winner.
Core Components: Structs, mappings, custom modifiers, and gas-efficient loops.
Events: Logs for session creation, voting, and announcing the winner.

//////////////////

2. Event Registration Contract
Manages event registrations where users pay a fee to participate until the event reaches capacity or a deadline.

Key Features: Create events, register participants, manage fees, and track attendance.
Core Components: Structs, mappings, access control modifiers, and reentrancy guards.
Events: Logs for event creation, registration, and summary reporting.

//////////////////

3. Digital Notebook Contract
A simple digital notebook for users to store, share, or make their notes public.

Key Features: Create, read, update, delete, and share notes.
Core Components: Structs, mappings for user notes, and access control via modifiers.
Events: Logs for note creation, updates, and sharing.
Link to Verified Contract
