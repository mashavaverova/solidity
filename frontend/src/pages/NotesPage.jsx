import { useContext, useState } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import NotesABI from '../abis/NotesABI.json'
import '../CSS/global.CSS';

const contractAddress = '0x41d8F32b77A88B2f0798B1256CDC2feCD035A027';


const NotesPage = () => {
 const { walletAddress, web3 } = useContext(WalletContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sharedWith, setSharedWith] = useState('');
  const [noteId, setNoteId] = useState('');
  const [noteContent, setNoteContent] = useState(null);

  const [updateNoteId, setUpdateNoteId] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newSharedWith, setNewSharedWith] = useState('');

  const [deleteNoteId, setDeleteNoteId] = useState('');

  // Create note function
  const handleCreateNote = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(NotesABI, contractAddress);
      const sharedWithArray = sharedWith.split(',').map((address) => address.trim());

      try {
        await contract.methods
          .createNote(title, content, isPublic, sharedWithArray)
          .send({ from: walletAddress });

        alert('Note created successfully!');
      } catch (error) {
        console.error('Error creating note:', error);
      }
    }
  };

  // Read note function
  const handleReadNote = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(NotesABI, contractAddress);

      try {
        const note = await contract.methods.readNote(noteId).call({ from: walletAddress });
        setNoteContent(`Title: ${note.title}, Content: ${note.content}`);
      } catch (error) {
        console.error('Error reading note:', error);
      }
    }
  };

  // Update sharing settings of a note
  const handleUpdateNote = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(NotesABI, contractAddress);
      const newSharedWithArray = newSharedWith.split(',').map((address) => address.trim());

      try {
        await contract.methods
          .updateSharingSettings(updateNoteId, newIsPublic, newSharedWithArray)
          .send({ from: walletAddress });

        alert('Note updated successfully!');
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }
  };

  // Delete a note
  const handleDeleteNote = async () => {
    if (web3 && walletAddress) {
      const contract = new web3.eth.Contract(NotesABI, contractAddress);

      try {
        await contract.methods.deleteNote(deleteNoteId).send({ from: walletAddress });
        alert('Note deleted successfully!');
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  return (
    <div>
      <h2>Notes Dapp</h2>

      {walletAddress ? (
        <div>
          <h3>Create a New Note</h3>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="checkbox-container">
            <input
             id="publicCheckbox"
             type="checkbox"
             checked={newIsPublic}
             onChange={() => setNewIsPublic(!newIsPublic)}
            />
            <label htmlFor="publicCheckbox">
              Is Public
            </label>
          </div>
          <input
            type="text"
            placeholder="Shared with (comma-separated addresses)"
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
          />
          <button onClick={handleCreateNote}>Create Note</button>

          <h3>Read a Note</h3>
          <input
            type="text"
            placeholder="Note ID"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
          />
          <button onClick={handleReadNote}>Read Note</button>

          {noteContent && (
            <div>
              <h4>Note Content</h4>
              <p>{noteContent}</p>
            </div>
          )}

          <h3>Update Note Sharing Settings</h3>
          <input
            type="text"
            placeholder="Note ID"
            value={updateNoteId}
            onChange={(e) => setUpdateNoteId(e.target.value)}
          />
       <div className="checkbox-container">
        <input
           id="publicCheckbox"
           type="checkbox"
           checked={newIsPublic}
           onChange={() => setNewIsPublic(!newIsPublic)}
        />
         <label htmlFor="publicCheckbox">
           Is Public
         </label>
      </div>
          <input
            type="text"
            placeholder="New Shared with (comma-separated addresses)"
            value={newSharedWith}
            onChange={(e) => setNewSharedWith(e.target.value)}
          />
          <button onClick={handleUpdateNote}>Update Note</button>

          <h3>Delete a Note</h3>
          <input
            type="text"
            placeholder="Note ID"
            value={deleteNoteId}
            onChange={(e) => setDeleteNoteId(e.target.value)}
          />
          <button onClick={handleDeleteNote}>Delete Note</button>
        </div>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};


export default NotesPage;
