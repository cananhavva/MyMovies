package com.mymovies.client.model;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.StringTokenizer;

import com.mymovies.client.common.DataProvider;

public class Movie {
	private long id;
	private String name;
	private int year;
	private String imdb;
	private ArrayList<Long> genres;
	private HashMap<Long, Timestamp> tags; // tagID, Timestamp
	private HashMap<Long, Long> taggingUsers; // tagID, userid
	private HashMap<Long, Rating> ratings; // userId, Rating
	
	public Movie(long id, String name, int year) {
		super();
		this.id = id;
		this.name = name;
		this.year = year;
		this.imdb = null;
		this.genres = new ArrayList<>();
		this.tags = new HashMap<>();
		this.taggingUsers = new HashMap<>();
		this.ratings = new HashMap<>();
	}
	
	public long getId() {
		return this.id;
	}
	
	public String getName() {
		return this.name;
	}
	
	public int getYear() {
		return this.year;
	}
	
	public String getImdb() {
		return this.imdb;
	}
	
	public void setImdb(String id) {
		this.imdb = id;
	}
	
	public void addGenre(long id) {
		this.genres.add(id);
	}
	
	public ArrayList<Long> getGenres() {
		return this.genres;
	}
	
	public void addTag(Tag tag, Timestamp timestamp, long userId) {
		this.tags.put(tag.getId(), timestamp);
		this.taggingUsers.put(tag.getId(), userId);
	}
	
	public HashMap<Long, Timestamp> getTags() {
		return this.tags;
	}
	
	public HashMap<Long, Long> getTagggingUsers() {
		return this.taggingUsers;
	}
	
	@Override
	public String toString() {
		return "Movie [id=" + this.id + ", name=" + this.name + ", year=" + this.year + ", imdb=" + this.imdb + "]";
	}
	
	public static void parse(String line) {
		int firstCommaPos = line.indexOf(",");
		int lastCommaPos = line.lastIndexOf(",");
		
		long id = Long.parseLong(line.substring(0, firstCommaPos));
		String genres = line.substring(lastCommaPos + 1);
		String name = line.substring(firstCommaPos + 1, lastCommaPos);
		int pos = name.lastIndexOf("(");
		
		int year = 0;
		try {
			year = Integer.parseInt(name.substring(pos + 1, name.lastIndexOf(")")));
			name = name.substring(0, pos).trim();
		} catch (Exception ex) {
			System.err.println("Error while parsing: " + line);
		}
		
		Movie movie = new Movie(id, name, year);
		
		StringTokenizer tokenizer = new StringTokenizer(genres, "|");
		while (tokenizer.hasMoreElements()) {
			String genre = ((String) tokenizer.nextToken()).toUpperCase();
			Genre obj = DataProvider.getInstance().getTypes().get(genre);
			
			if (obj == null) {
				Genre type = new Genre(genre);
				DataProvider.getInstance().getTypes().put(genre, type);
				movie.addGenre(type.getId());
			} else {
				movie.addGenre(obj.getId());
			}
		}
		DataProvider.getInstance().getMovies().put(movie.getId(), movie);
	}
	
	public static void parseLink(String line) {
		StringTokenizer tokenizer = new StringTokenizer(line, ",");
		try {
			long movieId = Long.parseLong(tokenizer.nextToken());
			String imdbId = tokenizer.nextToken();
			DataProvider.getInstance().getMovie(movieId).setImdb(imdbId);
		} catch (NumberFormatException ex) {
			System.err.println("Error while parsing movieId. Source: " + line);
		} catch (Exception ex) {
			System.err.println("Movie not found. Source: " + line);
		}
	}
	
	public void addRating(long userId, Rating aRating) {
		this.ratings.put(userId, aRating);
	}
	
	public HashMap<Long, Rating> getRatings() {
		return this.ratings;
	}
}
