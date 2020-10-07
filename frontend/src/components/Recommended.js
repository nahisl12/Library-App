import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS, ME } from '../queries';

const Recommended = ({ show }) => {
  const me = useQuery(ME);
  const books = useQuery(ALL_BOOKS);
  const [filteredBooks, setFilteredBooks] = useState(null);

  useEffect(() => {
    if (books.data) {
      setFilteredBooks(books.data.allBooks.filter(book => book.genres.includes('self-hate')));
    }
  }, [books.data, me.data])

  if(books.loading) {
    return <div>loading...</div>;
  }
  if(me.loading) {
    return <div>loading ...</div>;
  }

  if(!show) return null;

  console.log(me)
  console.log(books)

  return (
    <>
    <h4>Books from my favoutite genre</h4>
    <table>
      <thead>
        <tr>
          <th>title</th>
          <th>author</th>
          <th>published</th>
        </tr>
      </thead>
          <tbody>
            {filteredBooks.map((book, i) => {
              return(
                <tr key={`book-${i}`}>
                  <td>{book.title}</td>
                  <td>{book.author.name}</td>
                  <td>{book.published}</td>
                </tr>
              )
            })}
          </tbody>
    </table>
    </>
  )
}

export default Recommended;
