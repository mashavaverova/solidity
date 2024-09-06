// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract FilmVoting {

    struct Movie {
        string name;
        uint voteCount;
    }

    struct VotingSession {
        Movie[] movies;
        VotingState votingState;
        address creator; // The address that created this voting session (only this address can start and end the voting)
        uint endTime; // The timestamp when voting should end
        string winner;
        mapping(address => bool) hasVoted;
        mapping(address => uint) previousVote;
    }

    enum VotingState {NotStarted, IsOpen, Finished} // States for controlling the voting process

    uint public votingCounter;  // Counter to assign unique IDs to each voting session
    mapping(uint => VotingSession) public votingSessions; // Store all voting sessions by their ID

    error VotingStateError(VotingState currentState, VotingState requiredState); // Custom error for gas optimization

    // Events for logging and tracking important activities
    event VotingCreated(uint votingID, uint endTime);
    event VotingStarted(uint votingID, uint endTime);
    event Voted(uint votingID, address indexed voter, string movieName);
    event VotingEnded(uint votingID, string winner, uint winningVoteCount);

    // Modifier to ensure functions are only called when the contract is in the correct state
    modifier inState(uint _votingID, VotingState _state) {
        if (votingSessions[_votingID].votingState != _state) {
            revert VotingStateError(votingSessions[_votingID].votingState, _state); // Gas-efficient error
        }
        _;
    }

    constructor() {
        votingCounter = 0;  // Initialize the counter
    }

    /**
     * @dev Create a new voting session with a list of movies and a voting duration.
     * Gas Optimization: Loop through the movie list only once and use memory where applicable.
     */
    function createVoting(string[] memory _MovieList, uint _votingDuration) public returns (uint votingID) {
        require(_MovieList.length > 0, "Movie list cannot be empty"); // Security: Ensure there's something to vote on

        votingID = votingCounter; // Assign unique ID
        votingCounter++; // Increment the voting counter

        VotingSession storage newVoting = votingSessions[votingID];
        newVoting.votingState = VotingState.NotStarted;
        newVoting.creator = msg.sender; // Set the creator of this voting session
        newVoting.endTime = block.timestamp + _votingDuration; // Set the end time for this voting session
        newVoting.winner = "";

        // Gas Optimization: Loop through the movie list only once
        for (uint i = 0; i < _MovieList.length; i++) {
            newVoting.movies.push(Movie({
                name: _MovieList[i],
                voteCount: 0
            }));
        }

        emit VotingCreated(votingID, newVoting.endTime);
        return votingID;
    }

    /**
     * @dev Start the voting session. Only the creator of this session can start it.
     * Gas & Security: Checks that only the creator can start voting and that the voting state is correct.
     */
    function startVoting(uint _votingID) public inState(_votingID, VotingState.NotStarted) {
        VotingSession storage voting = votingSessions[_votingID];
        require(msg.sender == voting.creator, "Only the creator can start the voting"); // Security: Only the creator can start
        require(block.timestamp < voting.endTime, "Voting time has already ended"); // Security: Prevent starting after time ends

        voting.votingState = VotingState.IsOpen; // Set state to open
        emit VotingStarted(_votingID, voting.endTime);
    }

    /**
     * @dev Cast a vote for a movie. If the user has voted before, their previous vote is deducted.
     * Gas Optimization: Use unchecked loops to save gas and update the previous vote efficiently.
     */
    function vote(uint _votingID, string memory _votingMovie) public inState(_votingID, VotingState.IsOpen) {
        VotingSession storage voting = votingSessions[_votingID];
        require(block.timestamp < voting.endTime, "Voting time has already ended"); // Security: Ensure voting happens in the allowed time

        uint movieIndex;
        bool movieFound = false;

        // Gas Optimization: Use unchecked loops for efficiency
        for (uint i = 0; i < voting.movies.length; ) {
            if (keccak256(bytes(voting.movies[i].name)) == keccak256(bytes(_votingMovie))) {
                movieIndex = i;
                movieFound = true;
                break;
            }
            unchecked { i++; } // Save gas by skipping overflow checks
        }
        require(movieFound, "Movie not found."); // Security: Ensure the movie exists

        if (voting.hasVoted[msg.sender]) {
            uint previousIndex = voting.previousVote[msg.sender];
            voting.movies[previousIndex].voteCount -= 1; // Adjust previous vote
        }

        voting.movies[movieIndex].voteCount += 1; // Add vote to the new movie
        voting.hasVoted[msg.sender] = true; // Track that this address has voted
        voting.previousVote[msg.sender] = movieIndex; // Store the new vote

        emit Voted(_votingID, msg.sender, voting.movies[movieIndex].name);
        assert(voting.movies[movieIndex].voteCount > 0); // Sanity check to catch unexpected behavior
    }

    /**
     * @dev End the voting session and determine the winner. Only the creator can end the voting.
     * Gas & Security: Ensure only the creator can end the session and avoid ending prematurely.
     */
    function endVoting(uint _votingID) public inState(_votingID, VotingState.IsOpen) {
        VotingSession storage voting = votingSessions[_votingID];
        require(msg.sender == voting.creator, "Only the creator can end the voting"); // Security: Only the creator can end
        require(block.timestamp >= voting.endTime, "Voting period has not ended yet"); // Security: Prevent ending too early

        voting.votingState = VotingState.Finished; // Set the state to finished

        uint winningVoteCount = 0;

        // Determine the winner by looping through movies
        for (uint i = 0; i < voting.movies.length; i++) {
            if (voting.movies[i].voteCount > winningVoteCount) {
                winningVoteCount = voting.movies[i].voteCount;
                voting.winner = voting.movies[i].name;
            }
        }

        emit VotingEnded(_votingID, voting.winner, winningVoteCount); // Emit winner event
    }

    /**
     * @dev Get the winner of a finished voting session. 
     * Security: Only allow access once the voting is finished.
     */
    function getWinner(uint _votingID) public view inState(_votingID, VotingState.Finished) returns (string memory) {
        return votingSessions[_votingID].winner;
    }

    /**
     * @dev Get the movies and their vote counts for a particular voting session.
     * Gas Optimization: Minimize storage reads by using memory.
     */
    function getMovies(uint _votingID) public view returns (Movie[] memory) {
        VotingSession storage voting = votingSessions[_votingID];
        return voting.movies; // Return the list of movies and their vote counts
    }
}
