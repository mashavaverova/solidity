import { useContext, useState } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import FilmVotingABI from '../abis/FilmVotingABI.json';
import '../CSS/global.CSS';

const contractAddress = '0x3FA6bFfE185181Ef8Ec1099429ef8bFeA9Bb8b08';


const VotingPage = () => {
  const { walletAddress, web3 } = useContext(WalletContext);

  // States for creating a voting session
  const [movieList, setMovieList] = useState('');
  const [votingDuration, setVotingDuration] = useState('');
  const [votingId, setVotingId] = useState('');

  // States for voting and getting results
  const [votingMovie, setVotingMovie] = useState('');
  const [winner, setWinner] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset error before a new action
  const resetError = () => {
    setError('');
  };

  // Create a new voting session with validation
  const handleCreateVotingSession = async () => {
    resetError();
    if (!movieList || !votingDuration) {
      setError('Please fill in both the movie list and voting duration.');
      return;
    }

    setLoading(true);
    const movieArray = movieList.split(',').map(movie => movie.trim());
    if (movieArray.length === 0) {
      setError('Movie list cannot be empty.');
      setLoading(false);
      return;
    }

    if (isNaN(votingDuration) || Number(votingDuration) <= 0) {
      setError('Voting duration must be a positive number.');
      setLoading(false);
      return;
    }

    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(FilmVotingABI, contractAddress);
      try {
        const result = await contract.methods
          .createVoting(movieArray, votingDuration)
          .send({ from: walletAddress });
        
        setVotingId(result.events.VotingCreated.returnValues.votingID);
        alert('Voting session created successfully!');
      } catch (err) {
        setError('Failed to create voting session.');
        console.error(err);
      }
    }
    setLoading(false);
  };

  // Start the voting session with validation
  const handleStartVoting = async () => {
    resetError();
    if (!votingId) {
      setError('Please provide a valid voting session ID.');
      return;
    }

    setLoading(true);
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(FilmVotingABI, contractAddress);
      try {
        await contract.methods.startVoting(votingId).send({ from: walletAddress });
        alert('Voting session started successfully!');
      } catch (err) {
        setError('Failed to start voting session.');
        console.error(err);
      }
    }
    setLoading(false);
  };

  // Vote for a movie with validation
  const handleVote = async () => {
    resetError();
    if (!votingMovie || !votingId) {
      setError('Please provide both a movie name and a voting session ID.');
      return;
    }

    setLoading(true);
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(FilmVotingABI, contractAddress);
      try {
        await contract.methods.vote(votingId, votingMovie).send({ from: walletAddress });
        alert('Vote cast successfully!');
      } catch (err) {
        setError('Failed to cast vote.');
        console.error(err);
      }
    }
    setLoading(false);
  };

  // End the voting session and get the winner with validation
  const handleEndVoting = async () => {
    resetError();
    if (!votingId) {
      setError('Please provide a valid voting session ID.');
      return;
    }

    setLoading(true);
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(FilmVotingABI, contractAddress);
      try {
        await contract.methods.endVoting(votingId).send({ from: walletAddress });
        alert('Voting session ended successfully!');

        // Fetch and display the winner
        const winner = await contract.methods.getWinner(votingId).call();
        setWinner(winner);
      } catch (err) {
        setError('Failed to end voting session.');
        console.error(err);
      }
    }
    setLoading(false);
  };

  // Fetch the movies and their vote counts
  const handleGetMovies = async () => {
    resetError();
    if (!votingId) {
      setError('Please provide a valid voting session ID.');
      return;
    }

    setLoading(true);
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(FilmVotingABI, contractAddress);
      try {
        const movies = await contract.methods.getMovies(votingId).call();
        setMovies(movies);
      } catch (err) {
        setError('Failed to fetch movies and votes.');
        console.error(err);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Film Voting Dapp</h2>

      {walletAddress ? (
        <div>
          <h3>Create a New Voting Session</h3>
          <input
            type="text"
            placeholder="Movie List (comma-separated)"
            value={movieList}
            onChange={(e) => setMovieList(e.target.value)}
          />
          <input
            type="text"
            placeholder="Voting Duration (in seconds)"
            value={votingDuration}
            onChange={(e) => setVotingDuration(e.target.value)}
          />
          <button onClick={handleCreateVotingSession} disabled={loading}>
            {loading ? 'Creating...' : 'Create Voting Session'}
          </button>

          <h3>Start Voting Session</h3>
          <input
            type="text"
            placeholder="Voting Session ID"
            value={votingId}
            onChange={(e) => setVotingId(e.target.value)}
          />
          <button onClick={handleStartVoting} disabled={loading}>
            {loading ? 'Starting...' : 'Start Voting'}
          </button>

          <h3>Vote for a Movie</h3>
          <input
            type="text"
            placeholder="Movie Name"
            value={votingMovie}
            onChange={(e) => setVotingMovie(e.target.value)}
          />
          <button onClick={handleVote} disabled={loading}>
            {loading ? 'Voting...' : 'Vote'}
          </button>

          <h3>End Voting Session</h3>
          <button onClick={handleEndVoting} disabled={loading}>
            {loading ? 'Ending...' : 'End Voting'}
          </button>

          {winner && (
            <div>
              <h4>Winner of Voting Session {votingId}: {winner}</h4>
            </div>
          )}

          <h3>Get Movies and Their Vote Counts</h3>
          <button onClick={handleGetMovies} disabled={loading}>
            {loading ? 'Fetching...' : 'Get Movies'}
          </button>

          {movies.length > 0 && (
            <div>
              <h4>Movies and Votes:</h4>
              <ul>
                {movies.map((movie, index) => (
                  <li key={index}>{movie.name}: {movie.voteCount} votes</li>
                ))}
              </ul>
            </div>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};

export default VotingPage;