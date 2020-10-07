import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS } from '../queries';

const Books = ({show}) => {
  const books = useQuery(ALL_BOOKS);
  const [genres, setGenres] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState(null);

  useEffect(() => {
    if (books.data) {
      setFilteredBooks(books.data.allBooks.map(book => {
        book.genres.forEach(genre => {
          if (!genres.includes(genre)) setGenres(genres.concat(genre))
       });
      return book;
   }))
  }
}, [books.data, genres])

  if(books.loading) {
    return <div>Loading...</div>
  } 

  if (!show) {
    return null;
  }

  const filterBooksByGenre = filter => {
    setFilteredBooks(books.data.allBooks.filter(book => book.genres.includes(filter)));
  }

  const allBooks = () => {
    setFilteredBooks(books.data.allBooks.map(book => book))
  };

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th>title</th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {filteredBooks.map((book, i) =>
            <tr key={i}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div>
      <h3>Genres</h3>
        {
          genres.map(g => <button key={g} onClick={() => filterBooksByGenre(g)}>{g}</button>)
        }
        <button onClick={() => allBooks()}>All Genres</button>
      </div>
    </div>
  )
}

export default Books;