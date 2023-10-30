import { useState, useEffect, useRef } from "react";

// import {tempMovieData, tempWatchedData} from './data.js' // temp data
import {average} from './helpers.js'; // helpers


const APIKEY = process.env.REACT_APP_APIKEY; // .env will not print to the console if we try to do it


export default function App() {
  // state for all movies and movies watched
  const [movies, setMovies] = useState([]);
 // const [watched, setWatched] = useState([]);

  // state for the fetch requests
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // state for selecting the id of the movie when clicked
  const [selectedId, setSelectedId] = useState(null);


  const [watched, setWatched] = useState(function(){
    const stored = localStorage.getItem('watchedMovies');
    return JSON.parse(stored) || []; // give me back the data from local storage parsed OR an empty array
  });


// functions

 // function to update sthe selected id
  const getSelected = (id) => {
    setSelectedId((prevState) => { // we use this to show and hide the SelectedMovie Component  {selectedId ? <SelectedMovie selectedId={selectedId}/> : (other components)
      return prevState === id ? null : id // if the prevstate is equal to the current id, set the id to null or keep the current id
     })
  }

  
  // function that updates the selected iD to null which closes the movie window
  const handleCloseMovie = () =>{
    setSelectedId(null);
  }


  
  // function that adds a new movie to the watched movies
  const handleAddWatched = (movie) => {
      setWatched((prevState) => {
        return[
            ...prevState,
            movie
        ]
      })
  }

  // function that filtersthe watched movies by its id
  const handleDeleteWatched = (id) => {
    setWatched((prevState) => {
          return prevState.filter((movie) => movie.imdbID !== id)
    })
  }



//local Storage 
useEffect(() => {
    localStorage.setItem('watchedMovies', JSON.stringify(watched))
},[watched]);


useEffect(() => {

  const controller = new AbortController(); // abort controller for the race condition

    const getMovieData = async() => {

      setIsLoading(true);

       try {

        // create  the fetch request and add the controller
        const response = await fetch(`https://www.omdbapi.com/?s=${searchTerm}&apikey=${APIKEY}`, {
          signal: controller.signal 
        }); 

        if(!response.ok){
          throw new Error('Something went wrong')
        }
        // set error to empty string if none exists
        setError('');


        const data = await response.json();
        if(data.Response === 'False'){
          throw new Error('No movie found')
        }
       
        // set the data from the api to the movies
        setMovies(data.Search)

       } catch (error) {
        if (error.name !== "AbortError") {
          console.log(error.message);
          setError(error.message);
        }

       }finally{
        setIsLoading(false) // set the isLoading to false
       }


       // if the search Term is less than 3 chars it will keep the viewport clear
       if(searchTerm.length < 3){
        setMovies([]);
        setError('');
        return;
       }
    }

    // call the function (make sure its inside the useEffect!!!)
    getMovieData();


      // cleanup funtion for race condition
      return(() => {
        controller.abort();
       })

}, [searchTerm]) // dependancy array holds the searchTerm as this is updated

  return (
    <>
      
      <Navbar>
          <NavLogo/>
          <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}/>
          <NavResults movies={movies}/>
      </Navbar>

      <Main>
        <Box>
          {isLoading && <Loader text="Loading..."/>}
          {!isLoading && !error && <MovieList movies={movies} onGetSelectedId={getSelected} />}
          {error && <ErrorMessage message={error}/>}

        </Box>

        <Box>
          
            {selectedId ? <SelectedMovie selectedId={selectedId} onCloseMovie={handleCloseMovie} onAddWatched={handleAddWatched} /> : (
             <>
              <Summary watched={watched}/>
              <WatchedMoviesList watched={watched} onHandleDelete={handleDeleteWatched}/>
             </>
            )}
        </Box>
      </Main>

    </>
  );
}





// navigation components
const Navbar = ({children}) => {
    return(
      <nav className="nav-bar">
        {children}
        </nav>
    )
  } 



const NavLogo = () => {
  return(
    <div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>
  )
}


const SearchInput = ({value, onChange}) => {

  // 1. the useRef for DOm element outside of the useEffect
  const searchInputRef = useRef(null);


  // 3. create the useEffect hook
  useEffect(() => {
    
    // create our function
    const focusElement = (e) => {
      // the active element in the document points to the searchInput Ref
      // this removes the focus when the input field is empty
      if(document.activeElemment === searchInputRef.current) return;

     if(e.code === 'Enter'){
      searchInputRef.current.focus();
      
     }
    }
    
    // create the eventListner
    document.addEventListener('keypress', focusElement);

    // cleanup and remove the listener
    return(() => {
      document.removeEventListener('keypress', focusElement)
    })
  }, []);

    return(
      <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={value}
      onChange={onChange}
      ref={searchInputRef} // 2. connecting the useRef hook
    />
    )
}


const NavResults = ({movies}) => {

  return(
    <p className="num-results">
    Found <strong>{movies?.length}</strong> results
  </p>
  )
}





const Main = ({children}) => {
  return(
    <main className="main">
     {children}
  </main>
  )
}




const MovieList = ({movies, onGetSelectedId}) => {

  return(<ul className="list list-movies">
  {movies?.map((movie) => (
    <Movie movie={movie} key={movie.imdbID} onGetSelectedId={onGetSelectedId}/>
  ))}
</ul>)
}


const Movie = ({movie, onGetSelectedId}) => {
  return (
    <li onClick={() => onGetSelectedId(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  )
}


const Summary = ({watched}) => {
  
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  console.log(avgRuntime)

     
  return(
    <div className="summary">
                <h2>Movies you watched</h2>
                <div>
                  <p>
                    <span>#️⃣</span>
                    <span>{watched.length} movies</span>
                  </p>
                  <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating}</span>
                  </p>
                  <p>
                    <span>🌟</span>
                    <span>{avgUserRating}</span>
                  </p>
                  <p>
                    <span>⏳</span>
                    <span>{avgRuntime || 0} min</span>
                  </p>
                </div>
              </div>
  )
}



const WatchedMoviesList = ({watched, onHandleDelete}) => {
  return(
    <ul className="list">
    {watched?.map((movie) => (
     <WatchedMovie movie={movie} key={movie.imdbID} onHandleDelete={onHandleDelete}/>
    ))}
  </ul>
  )
}

const WatchedMovie = ({movie, onHandleDelete}) => {
 const {imdbID, title, poster, imdbRating, runtime} = movie;
  return(
    <li>
    <img src={poster} alt={`${title} poster`} />
    <h3>{title}</h3>
    <div>
      <p>
        <span>⭐️</span>
        <span>{imdbRating}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{runtime}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{movie.runtime} min</span>
      </p>

      <button className="btn-delete" onClick={() => onHandleDelete(imdbID)}>ｘ</button>
    </div>
  </li>
  )
}



// universal box compnent
const Box = ({children}) => {

  const [isOpen, setIsOpen] = useState(true);

  return(
    <div className="box">
    <Button onClick={() => setIsOpen((open) => !open)}> {isOpen ? "–" : "+"}</Button>
    {isOpen && (children)}
  </div>
  )
}



const Button = ({children, onClick}) => {
  return <button onClick={onClick}className="btn-toggle">{children}</button>
}



const Loader = ({text}) => {
  return <div className="loader"><span>{text}</span></div>
}


const ErrorMessage = ({message}) => {
    return(
      <p className="error">{message}</p>
    )
  }



const SelectedMovie = ({selectedId, onCloseMovie, onAddWatched}) => {

  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);


// desctructuring
let{
  Title: title,
  Poster: poster,
  Runtime: runtime,
  Year: year,
  imdbRating,
  Plot: plot,
  Released: released,
  Actors: actors,
  Director: director,
  Genre: genre,
} = movie;


const safeReturn = (str) => {
    return str ?? 'n/a';
}

title = safeReturn(title)
poster = safeReturn(poster)
runtime = safeReturn(runtime)
let rating = safeReturn(imdbRating)
plot = safeReturn(plot)
released = safeReturn(released)
actors = safeReturn(actors)
director = safeReturn(director)
genre = safeReturn(genre)

const handleAdd = () => {
  // new object / check the watched movie component for the items we need
  const newWatchedMovie = {
    imdbID: selectedId,
    title: title,
    year: year,
    poster: poster,
    imdbRating: Number(imdbRating),
    runtime: Number(runtime.split(" ").at(0)),
    rating: rating,
  };
  onAddWatched(newWatchedMovie); // pass it onto the onWatchedFunction
  onCloseMovie(); // close the panel when the movie is added / button click
}




// events with useEffect
// each time we press escape the onCloseMovie runs
// But we will need to clean it up or the event listeners will build up everytime the component updates
useEffect(() => {
   // we need to create the function and pass it into the event listener as when we use the cleanup function the listener needs to be the same
    const keyEvent = (e) => {
        if(e.code === 'Escape'){
          onCloseMovie();
        }
    }

    document.addEventListener('keydown', keyEvent)
  return () => {
    document.addEventListener('keydown', keyEvent)
  };
}, [onCloseMovie]);


  useEffect(() => {
   setLoading(true)
    const getMovieDetails = async() => {
   
      try {
        const response = await fetch(`https://www.omdbapi.com/?i=${selectedId}&apikey=${APIKEY}`); 
        if(!response.ok){
          throw new Error('Something went wrong')
        }
        const data = await response.json();
        
        setMovie(data);
        setLoading(false)
        
      } catch (error) {
          console.log(error)

      }finally{
        setLoading(false)
      }
    }

    getMovieDetails();

  }, [selectedId]);

 

  useEffect(() => {
    if(!title) return;
     document.title = title;
    return () => {
     document.title = 'use popcorn'
    };
  }, [title]);



    return (
      <div className="details">

      {loading ? (<Loader text="loading Movie"/>) : (
        <>
        <header>
          <button className="btn-back" onClick={onCloseMovie}>&larr;</button>
          <img src={poster} alt={title} />
          <div className="details-overview">
              <h2>{title}</h2>
              <p>{released} &bull; {runtime}</p>
              <p>{genre}</p>
              <p>⭐️<span>{rating} IMBd Rating</span></p>
          </div>
          </header>
          <button className="btn-add" onClick={handleAdd}>
            +Add to List
          </button>
          <section>
            <p><em>{plot}</em></p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
     
      </div>
    )
  }