package com.mymovies.client.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Set;

import com.bilgeadam.boost.course01.mymovies.client.ClientProperties;
import com.bilgeadam.boost.course01.mymovies.client.common.DataProvider;

public class Data {

	public Data() {
		super();
	}

	public static void parse() {
		parseMovies();
		parseLinks();
		parseTags();
		parseRatings();
	}

	private static void parseTags() {
		File file;
		file = new File(ClientProperties.getInstance().getTagsCSV());
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {
			while (true) {
				String line = bR.readLine();
				if (line == null)
					break;
				if (line.startsWith("userId"))
					continue;
				Tag.parse(line);
			}
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}

	private static void parseRatings() {
		File file;
		file = new File(ClientProperties.getInstance().getRatingsCSV());
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {
			while (true) {
				String line = bR.readLine();
				if (line == null)
					break;
				if (line.startsWith("userId"))
					continue;
				Rating.parse(line);
			}
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}

	private static void parseLinks() {
		File file;
		file = new File(ClientProperties.getInstance().getLinksCSV());
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {
			while (true) {
				String line = bR.readLine();
				if (line == null)
					break;
				if (line.startsWith("movieId"))
					continue;
				Movie.parseLink(line);
			}
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}

	private static void parseMovies() {
		File file = new File(ClientProperties.getInstance().getMoviesCSV());

		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {
			while (true) {
				String line = bR.readLine();
				if (line == null)
					break;
				if (line.startsWith("movieId"))
					continue;
				Movie.parse(line);
			}
		}
		catch (FileNotFoundException ex) {
			ex.printStackTrace();
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}

	public boolean importMovies() {
		try (Connection conn = Database.getInstance().getConnection(); Statement stmt = conn.createStatement();) {
//			return stmt.execute("COPY movies FROM '" + ClientProperties.getInstance().getMoviesCSV() + "' DELIMITER ',' CSV HEADER");
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}

		return false;
	}

	public boolean importTags() {
		try (Connection conn = Database.getInstance().getConnection(); Statement stmt = conn.createStatement();) {
//			return stmt.execute("COPY movies FROM '" + ClientProperties.getInstance().getMoviesCSV() + "' DELIMITER ',' CSV HEADER");
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}

		return false;
	}

	public static void load() {
		loadMovies();
		loadGenres();
		loadTags();
		loadUsers();
		loadMovieGenres();
		loadMovieTags();
		loadMovieRatings();
	}

	private static void loadMovies() {
		Set<Long> keys  = DataProvider.getInstance().getMovies().keySet();
		String    query = "INSERT INTO movies (id, name, year, imdb_id) VALUES (?, ?, ?, ?)";
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			for (Iterator<Long> iterator = keys.iterator(); iterator.hasNext();) {
				Movie movie = DataProvider.getInstance().getMovie(iterator.next());
				stmt.setLong(1, movie.getId());
				stmt.setString(2, movie.getName());
				stmt.setInt(3, movie.getYear());
				stmt.setString(4, movie.getImdb());
				stmt.execute();
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadGenres() {
		Set<String> keys  = DataProvider.getInstance().getTypes().keySet();
		String      query = "INSERT INTO genres (id, genre) VALUES (?, ?)";
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			for (Iterator<String> iterator = keys.iterator(); iterator.hasNext();) {
				Genre genre = DataProvider.getInstance().getTypes().get(iterator.next());
				stmt.setLong(1, genre.getId());
				stmt.setString(2, genre.getName());
				stmt.execute();
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadTags() {
		Set<String> keys  = DataProvider.getInstance().getTags().keySet();
		String      query = "INSERT INTO tags (id, tag) VALUES (?, ?)";
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			for (Iterator<String> iterator = keys.iterator(); iterator.hasNext();) {
				Tag tag = DataProvider.getInstance().getTags().get(iterator.next());
				stmt.setLong(1, tag.getId());
				stmt.setString(2, tag.getTag());
				stmt.execute();
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadUsers() {
		Set<Long> keys  = DataProvider.getInstance().getUsers().keySet();
		String    query = "INSERT INTO users (id, name) VALUES (?, ?)";
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			for (Iterator<Long> iterator = keys.iterator(); iterator.hasNext();) {
				User user = DataProvider.getInstance().getUsers().get(iterator.next());
				stmt.setLong(1, user.getId());
				stmt.setString(2, user.getName());
				stmt.execute();
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadMovieGenres() {
		String    query     = "INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)";
		Set<Long> movieKeys = DataProvider.getInstance().getMovies().keySet();
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			for (Iterator<Long> iterator = movieKeys.iterator(); iterator.hasNext();) {
				Movie           movie  = DataProvider.getInstance().getMovies().get(iterator.next());
				ArrayList<Long> genres = movie.getGenres();
				for (Iterator<Long> iterator2 = genres.iterator(); iterator2.hasNext();) {
					Long genreId = iterator2.next();
					stmt.setLong(1, movie.getId());
					stmt.setLong(2, genreId);
					stmt.execute();
				}
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadMovieTags() {
		String    query     = "INSERT INTO movie_tags (movie_id, user_id, tag_id, tagged_at) VALUES (?, ?, ?, ?)";
		Set<Long> movieKeys = DataProvider.getInstance().getMovies().keySet();
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {

			for (Iterator<Long> iterator = movieKeys.iterator(); iterator.hasNext();) {
				Movie                    movie        = DataProvider.getInstance().getMovies().get(iterator.next());
				HashMap<Long, Timestamp> tags      = movie.getTags();                                            // tagID, Timestamp
				HashMap<Long, Long>      taggingUsers = movie.getTagggingUsers();                                   // tagID, userID

				Set<Long> tagKeys = tags.keySet();
				for (Iterator<Long> iterator2 = tagKeys.iterator(); iterator2.hasNext();) { 
					Long   tagId = iterator2.next();  
					Timestamp time = tags.get(tagId);
					Long userId = taggingUsers.get(tagId);
					stmt.setLong(1, movie.getId());
					stmt.setLong(2, userId);
					stmt.setLong(3, tagId);
					stmt.setTimestamp(4, time);
					stmt.execute();
				}
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}

	private static void loadMovieRatings() {
		String    query     = "INSERT INTO movie_ratings (movie_id, user_id, rating, rated_at) VALUES (?, ?, ?, ?)";
		Set<Long> movieKeys = DataProvider.getInstance().getMovies().keySet();
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {

			for (Iterator<Long> iterator = movieKeys.iterator(); iterator.hasNext();) {
				Movie                 movie   = DataProvider.getInstance().getMovies().get(iterator.next());
				HashMap<Long, Rating> ratings = movie.getRatings();                                         // userId,
																											// Rating

				Set<Long> ratingKeys = ratings.keySet();
				for (Iterator<Long> iterator2 = ratingKeys.iterator(); iterator2.hasNext();) { // for(ilk değer atama;
																								// koşul, arttırma)
					Long   userId = iterator2.next();   // arttırma ama bu satırda
					Rating rating = ratings.get(userId);
					stmt.setLong(1, movie.getId());
					stmt.setLong(2, userId);
					stmt.setDouble(3, rating.getRating());
					stmt.setTimestamp(4, rating.getRated());
					stmt.execute();
				}
			}
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
	}
}
