// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// Evenmang: An event management contract optimized for gas efficiency and security.
contract Evenmang {

    // Struct to store event details. Efficient storage of event data with optimized types.
    struct Event {
        uint256 eventID;             // Unique event identifier.
        uint256 registrationFee;     // Fee for registering for the event.
        uint256 registrationDeadline;// Registration deadline as a timestamp.
        string eventName;            // Event name stored in calldata for gas optimization.
        uint8 maxPPL;                // Maximum participants, stored as uint8 to save space.
        uint8 currentPPL;            // Current participants count, optimized for storage.
        State state;                 // Current state of the event.
        mapping (address => string) participants; // Mapping to efficiently store participant names.
        address[] participantAddress; // Array to store participant addresses for easy access.
    }

    // Enum representing the state of an event to save gas over string literals.
    enum State { NotStarted, IsOpen, Finished }

    // Immutable creator address to save gas by avoiding storage reads.
    address public immutable creator;

    uint256 public eventCounter; // Counter for event IDs, reducing costly external calls.

    // Mapping to track all events by their ID.
    mapping(uint256 => Event) public events;

    // Custom errors for gas-efficient reverts.
    error NotAuthorized(address caller);
    error EventNotOpen(uint256 eventID, State currentState);
    error IncorrectRegistrationFee(uint256 sent, uint256 required);
    error EventAlreadyOpenOrFinished(uint256 eventID, State currentState);
    error InvalidRegistrationDeadline(uint256 providedDeadline, uint256 currentTime);
    error EventFullyBooked(uint256 eventID, uint256 maxPPL);
    error RegistrationDeadlinePassed(uint256 currentTime, uint256 deadline);

    // Events for off-chain tracking, optimizing on-chain storage.
    event EtherReceived(address indexed sender, uint256 amount);
    event FallbackTriggered(address indexed sender, uint256 amount, bytes data);
    event EventSummary(uint256 eventID, string eventName, uint256 totalParticipants, uint256 totalRevenue);

    // Reentrancy guard to prevent attacks.
    bool private locked;

    // Constructor to set the immutable creator address.
    constructor() {
        creator = msg.sender;
    }

    // Modifier to restrict access to the creator only.
    modifier onlyCreator() {
        if (msg.sender != creator) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    // Modifier to prevent reentrancy attacks.
    modifier noReentrancy() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /**
     * @dev Create a new event with a name, registration fee, and maximum participants.
     * Gas Optimization: Uses calldata for event name and directly updates storage to minimize gas usage.
     */
    function createEvent(string calldata _eventName, uint256 _registrationFee, uint8 _maxPPL) 
    public onlyCreator returns (uint256) {
        eventCounter++; // Efficiently increments the event counter.

        Event storage newEvent = events[eventCounter]; // Directly access storage to avoid copying data.

        // Initialize the event data.
        newEvent.eventID = eventCounter;
        newEvent.eventName = _eventName;
        newEvent.registrationFee = _registrationFee;
        newEvent.maxPPL = _maxPPL;
        newEvent.state = State.NotStarted;

        return eventCounter; // Return the newly created event's ID.
    }

    /**
     * @dev Open event registration with a deadline.
     * Gas Optimization: State and deadline checks are performed before updating storage.
     */
    function openRegistration(uint256 _eventID, uint256 _registrationDeadline) 
    public onlyCreator {
        Event storage eventDetails = events[_eventID];

        // Ensure the event is not already open or finished.
        if (eventDetails.state != State.NotStarted) {
            revert EventAlreadyOpenOrFinished(_eventID, eventDetails.state);
        }
        // Ensure the registration deadline is in the future.
        if (_registrationDeadline <= block.timestamp) {
            revert InvalidRegistrationDeadline(_registrationDeadline, block.timestamp);
        }

        // Open registration and set the deadline.
        eventDetails.state = State.IsOpen;
        eventDetails.currentPPL = 0;
        eventDetails.registrationDeadline = _registrationDeadline;
    }

    /**
     * @dev Register a participant for the event by paying the required fee.
     * Gas Optimization: Checks are done before modifying storage. Uses noReentrancy for security.
     */
    function participantRegistration(uint256 _eventID, string calldata _name) 
    public payable noReentrancy {
        Event storage eventDetails = events[_eventID];

        // Ensure the event is open for registration.
        if (eventDetails.state != State.IsOpen) {
            revert EventNotOpen(_eventID, eventDetails.state);
        }
        // Ensure the event has not reached its participant limit.
        if (eventDetails.currentPPL >= eventDetails.maxPPL) {
            revert EventFullyBooked(_eventID, eventDetails.maxPPL);
        }
        // Ensure the correct registration fee is sent.
        if (msg.value != eventDetails.registrationFee) {
            revert IncorrectRegistrationFee(msg.value, eventDetails.registrationFee);
        }
        // Ensure the registration deadline has not passed.
        if (block.timestamp > eventDetails.registrationDeadline) {
            revert RegistrationDeadlinePassed(block.timestamp, eventDetails.registrationDeadline);
        }

        uint8 newParticipantCount = eventDetails.currentPPL + 1;
        require(newParticipantCount > eventDetails.currentPPL, "Overflow occurred");

        // Store participant data and update participant count.
        eventDetails.participants[msg.sender] = _name;
        eventDetails.participantAddress.push(msg.sender);

        // Automatically close registration if the maximum participants are reached or the deadline passes.
        if (newParticipantCount == eventDetails.maxPPL || block.timestamp > eventDetails.registrationDeadline) {
            eventDetails.state = State.Finished;
        }

        eventDetails.currentPPL = newParticipantCount;
    }

    /**
     * @dev Close the registration manually and emit an event summary.
     * Gas Optimization: Emits an event for off-chain data handling, avoiding unnecessary on-chain storage.
     */
    function closeRegistration(uint256 _eventID) public onlyCreator {
        Event storage eventDetails = events[_eventID];

        // Ensure the event is open for registration.
        if (eventDetails.state != State.IsOpen) {
            revert EventNotOpen(_eventID, eventDetails.state);
        }

        // Mark the event as finished.
        eventDetails.state = State.Finished;

        // Calculate total participants and revenue.
        uint256 totalParticipants = eventDetails.currentPPL;
        uint256 totalRevenue = totalParticipants * eventDetails.registrationFee;

        // Emit a summary for off-chain tracking.
        emit EventSummary(_eventID, eventDetails.eventName, totalParticipants, totalRevenue);
    }

    /**
     * @dev Retrieve the list of participant addresses and names for a specific event.
     * Gas Optimization: Uses memory arrays to minimize storage costs.
     */
    function getParticipants(uint256 _eventID) public view returns (address[] memory, string[] memory) {
        Event storage eventDetails = events[_eventID];
        uint256 participantCount = eventDetails.participantAddress.length;
        string[] memory names = new string[](participantCount); // Allocate memory to reduce gas.

        // Populate the names array with participant names.
        for (uint256 i = 0; i < participantCount; i++) {
            address participantAddress = eventDetails.participantAddress[i];
            names[i] = eventDetails.participants[participantAddress];
        }

        return (eventDetails.participantAddress, names); // Return participant addresses and names.
    }

    /**
     * @dev Receive Ether and log it for tracking. Efficient for receiving funds.
     */
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value); // Log Ether received for off-chain tracking.
    }

    /**
     * @dev Fallback function to handle unexpected transactions or calls.
     */
    fallback() external payable {
        emit FallbackTriggered(msg.sender, msg.value, msg.data); // Log fallback occurrences for debugging.
    }

    /**
     * @dev Withdraw funds to the creator's address. Ensures sufficient balance before withdrawal.
     * Gas Optimization: Uses the call method for secure Ether transfer.
     */
    function withdrawPayments(uint256 amount) public onlyCreator {
        require(address(this).balance >= amount, "Insufficient balance");

        // Securely transfer the specified amount to the creator.
        (bool success, ) = creator.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
