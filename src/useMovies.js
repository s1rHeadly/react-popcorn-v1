import {useState, useEffect} from 'react'


///hooks are are regular function!!!!!
export const useMovies = (term) => {
 
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');



  const APIKEY = process.env.REACT_APP_APIKEY; // .env will not print to the console if we try to do it




  useEffect(() => {

    const controller = new AbortController(); // abort controller for the race condition
  
      const getMovieData = async() => {
  
        setIsLoading(true);
  
         try {
  
          // create  the fetch request and add the controller
          const response = await fetch(`https://www.omdbapi.com/?s=${term}&apikey=${APIKEY}`, {
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
         if(term.length < 3){
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
  
  }, [term]) // dependancy array holds the searchTerm as this is updated



    return{
      movies, setMovies, isLoading, setIsLoading, setError, error, term
    }

}

