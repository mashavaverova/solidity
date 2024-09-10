import  { useContext, useState } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import EvenmangABI from '../abis/EvenmangABI.json'; 
import '../CSS/global.CSS';

const contractAddress = '0x22a6E237fC7D4FD2a6560908A61E4819f7e4e02B'; 

const EventPage = () => {
  const { walletAddress, web3 } = useContext(WalletContext);

  // State for creating an event
  const [eventName, setEventName] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [maxPPL, setMaxPPL] = useState('');
  const [eventId, setEventId] = useState('');

  // State for registering as a participant
  const [participantName, setParticipantName] = useState('');
  const [registrationEventId, setRegistrationEventId] = useState('');

  // State for opening registration
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // State for fetching participants
  const [participants, setParticipants] = useState([]);
  const [participantNames, setParticipantNames] = useState([]);
  const [participantsEventId, setParticipantsEventId] = useState('');

  // Create a new event
  const handleCreateEvent = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(EvenmangABI, contractAddress);
      try {
        const result = await contract.methods
          .createEvent(eventName, web3.utils.toWei(registrationFee, 'ether'), maxPPL)
          .send({ from: walletAddress });
        
        setEventId(result.events.EventCreated.returnValues.eventID); // Assuming the event creation emits this
        alert('Event created successfully!');
      } catch (error) {
        console.error('Error creating event:', error);
      }
    }
  };

  // Open event registration
  const handleOpenRegistration = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(EvenmangABI, contractAddress);
      try {
        await contract.methods
          .openRegistration(eventId, registrationDeadline)
          .send({ from: walletAddress });
        alert('Registration opened successfully!');
      } catch (error) {
        console.error('Error opening registration:', error);
      }
    }
  };

  // Register as a participant
  const handleRegisterParticipant = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(EvenmangABI, contractAddress);
      try {
        await contract.methods
          .participantRegistration(registrationEventId, participantName)
          .send({ from: walletAddress, value: web3.utils.toWei(registrationFee, 'ether') });
        alert('Participant registered successfully!');
      } catch (error) {
        console.error('Error registering participant:', error);
      }
    }
  };

  // Fetch participants for an event
  const handleGetParticipants = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(EvenmangABI, contractAddress);
      try {
        const [addresses, names] = await contract.methods
          .getParticipants(participantsEventId)
          .call({ from: walletAddress });
        
        setParticipants(addresses);
        setParticipantNames(names);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    }
  };

  return (
    <div>
      <h2>Evenmang - Event Management Dapp</h2>

      {walletAddress ? (
        <div>
          <h3>Create a New Event</h3>
          <input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Registration Fee (ETH)"
            value={registrationFee}
            onChange={(e) => setRegistrationFee(e.target.value)}
          />
          <input
            type="text"
            placeholder="Max Participants"
            value={maxPPL}
            onChange={(e) => setMaxPPL(e.target.value)}
          />
          <button onClick={handleCreateEvent}>Create Event</button>

          <h3>Open Event Registration</h3>
          <input
            type="text"
            placeholder="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Registration Deadline (Unix timestamp)"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
          />
          <button onClick={handleOpenRegistration}>Open Registration</button>

          <h3>Register as a Participant</h3>
          <input
            type="text"
            placeholder="Event ID"
            value={registrationEventId}
            onChange={(e) => setRegistrationEventId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Participant Name"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
          />
          <button onClick={handleRegisterParticipant}>Register</button>

          <h3>Get Participants</h3>
          <input
            type="text"
            placeholder="Event ID"
            value={participantsEventId}
            onChange={(e) => setParticipantsEventId(e.target.value)}
          />
          <button onClick={handleGetParticipants}>Get Participants</button>

          {participants.length > 0 && (
            <div>
              <h4>Participants for Event {participantsEventId}</h4>
              <ul>
                {participants.map((participant, index) => (
                  <li key={participant}>
                    {participant}: {participantNames[index]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};

export default EventPage;
