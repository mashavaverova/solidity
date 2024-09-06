// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Evenmang {
    
struct Event {
    
    uint256 eventID;   // 32 bytes
    uint256 registrationFee;  // 32 bytes
    uint256 registrationDeadline; // 32 bytes
    string eventName; 
    uint8 maxPPL;  // 1 byte
    uint8 currentPPL; // 1 byte
    State state; // 1 byte
    mapping (address => string) participants;
    address[] participantAddress; 
    }
    enum State {NotStarted, IsOpen, Finished}
    address public immutable creator;
    uint256 public eventCounter;
    mapping(uint256 => Event) public events;


 // Custom Errors
    error NotAuthorized(address caller);
    error EventNotOpen(uint256 eventID, State currentState);
    error IncorrectRegistrationFee(uint256 sent, uint256 required);
    error EventAlreadyOpenOrFinished(uint256 eventID, State currentState);
    error InvalidRegistrationDeadline(uint256 providedDeadline, uint256 currentTime);
    error EventFullyBooked(uint256 eventID, uint256 maxPPL);
    error RegistrationDeadlinePassed(uint256 currentTime, uint256 deadline);

    event EtherReceived(address indexed sender, uint256 amount);
    event FallbackTriggered(address indexed sender, uint256 amount, bytes data);
    event EventSummary(uint256 eventID, string eventName, uint256 totalParticipants, uint256 totalRevenue);

    bool private locked;

    constructor() {
        creator = msg.sender;
    }

    modifier onlyCreator() {
        if (msg.sender != creator) {
         revert NotAuthorized(msg.sender);
         }
    _;
    }

// this modificator is for safety reasons and works against preventing reentrancy attacks. 
// i use it in registration function 
    modifier noReentrancy() {
     require(!locked, "ReentrancyGuard: reentrant call");
     locked = true;
      _;
     locked = false;
    }

    function createEvent( string calldata _eventName, uint256 _registrationFee, uint8 _maxPPL) public onlyCreator returns (uint256) {
        eventCounter++;

        Event storage newEvent = events[eventCounter];

        newEvent.eventID = eventCounter;
        newEvent.eventName = _eventName;
        newEvent.registrationFee = _registrationFee;
        newEvent.maxPPL = _maxPPL;
        newEvent.state = State.NotStarted;

        return eventCounter;
    }

   function openRegistration(uint256 _eventID, uint256 _registrationDeadline) public onlyCreator {
    Event storage eventDetails = events[_eventID];
    
    if (eventDetails.state != State.NotStarted) {
        revert EventAlreadyOpenOrFinished(_eventID, eventDetails.state);
    }
    if (_registrationDeadline <= block.timestamp) {
        revert InvalidRegistrationDeadline(_registrationDeadline, block.timestamp);
    }

    eventDetails.state = State.IsOpen;
    eventDetails.currentPPL = 0;
    eventDetails.registrationDeadline = _registrationDeadline;
    }

    function participantRegistration(uint256 _eventID, string calldata _name) public payable noReentrancy {
    Event storage eventDetails = events[_eventID];

    if (eventDetails.state != State.IsOpen) {
        revert EventNotOpen(_eventID, eventDetails.state);
    }
    if (eventDetails.currentPPL >= eventDetails.maxPPL) {
        revert EventFullyBooked(_eventID, eventDetails.maxPPL);
    }
    if (msg.value != eventDetails.registrationFee) {
        revert IncorrectRegistrationFee(msg.value, eventDetails.registrationFee);
    }
    if (block.timestamp > eventDetails.registrationDeadline) {
        revert RegistrationDeadlinePassed(block.timestamp, eventDetails.registrationDeadline);
    }

    uint8 newParticipantCount = eventDetails.currentPPL + 1;
    require(newParticipantCount > eventDetails.currentPPL, "Overflow occurred");  //  overflow check

    eventDetails.participants[msg.sender] = _name;
    eventDetails.participantAddress.push(msg.sender);

    if (newParticipantCount == eventDetails.maxPPL || block.timestamp > eventDetails.registrationDeadline) {
        eventDetails.state = State.Finished;
    }

    eventDetails.currentPPL = newParticipantCount;
}
    
    function closeRegistration (uint256 _eventID) public onlyCreator {
        Event storage eventDetails = events[_eventID];

    if (eventDetails.state != State.IsOpen) {
        revert EventNotOpen(_eventID, eventDetails.state);
    }       
    eventDetails.state = State.Finished;

    uint256 totalParticipants = eventDetails.currentPPL;
    uint256 totalRevenue = totalParticipants * eventDetails.registrationFee;
     emit EventSummary(_eventID, eventDetails.eventName, totalParticipants, totalRevenue); 
    }
           
   function getParticipants(uint256 _eventID) public view returns (address[] memory, string[] memory) {
        Event storage eventDetails = events[_eventID];
        uint256 participantCount = eventDetails.participantAddress.length;
        string[] memory names = new string[](participantCount);

        for (uint256 i = 0; i < participantCount; i++) {
            address participantAddress = eventDetails.participantAddress[i];
            names[i] = eventDetails.participants[participantAddress];
        }

        return (eventDetails.participantAddress, names);
    }


    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit FallbackTriggered(msg.sender, msg.value, msg.data);
    }

function withdrawPayments(uint256 amount) public onlyCreator {
    require(address(this).balance >= amount, "Insufficient balance");

    // Transfer the specified amount to the contract creator
    (bool success, ) = creator.call{value: amount}("");
    require(success, "Transfer failed");
}
}
