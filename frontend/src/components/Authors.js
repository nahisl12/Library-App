import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { EDIT_DATE, ALL_AUTHORS } from '../queries';

const Authors = ({show, authors}) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');
  const [ editDate ] = useMutation(EDIT_DATE, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  if (!show) {
    return null
  }

  const updateBirth = (event) => {
    event.preventDefault();
    
    editDate({ variables: { name, born } });

    setName('');
    setBorn('');
  }


  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th>author</th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Set birthyear</h2>
      <form onSubmit={updateBirth}>
      <div>
        {/* name <input type="text" name="name" value={name} onChange={({target}) => setName(target.value)}></input> */}
        Name
        <select onChange={({ target }) => setName(target.value)}>
          {authors.map(author => <option key={author.id} value={author.name}>{author.name}</option>)}  
        </select>
      </div>
      <div>
        born <input type="text" name="born" value={born} onChange={({target}) => setBorn(+target.value)}></input>
      </div>
      <button type="submit">update author</button>
      </form>
    </div>
  )
}

export default Authors
