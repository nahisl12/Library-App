import React, { useState } from 'react';
import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import LoginForm from './components/LoginForm';
import Recommended from './components/Recommended';
import { useQuery, useApolloClient } from '@apollo/client';
import { ALL_AUTHORS } from './queries';

const App = () => {
  const authors = useQuery(ALL_AUTHORS);
  const [page, setPage] = useState('authors');
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  if(authors.loading) {
    return <div>Loading...</div>
  }

  if(!token) {
    return (
    <div>
      <div>
      <button onClick={() => setPage('authors')}>authors</button>
      <button onClick={() => setPage('books')}>books</button>
      <button onClick={() => setPage('login')}>log in</button>
      </div>

      <Authors authors={authors.data.allAuthors}
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}
      />

      <LoginForm
        show={page === 'login'}
        setToken={setToken}
      />

    </div>
    )
  }

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={() => setPage('recommended')}>recommended</button>
        <button onClick={logout}>log out</button>

      </div>

      <Authors authors={authors.data.allAuthors}
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}
      />

      <NewBook
        show={page === 'add'}
      />

      <Recommended
        show={page === 'recommended'}
      />  

    </div>
  )
}

export default App