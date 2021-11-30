package com.mymovies.client.model;

import java.sql.Timestamp;
import java.util.StringTokenizer;

import com.bilgeadam.boost.course01.mymovies.client.common.DataProvider;

public class Rating {
	private double    rating;
	private Timestamp rated;

	public Rating(double rating, Timestamp rated) {
		this.rating = rating;
		this.rated  = rated;
	}

	public static void parse(String line) {
		StringTokenizer tokenizer = new StringTokenizer(line, ",");
//		userId,movieId,rating,timestamp
//		1,1,4.0,964982703

		long      userId    = Long.parseLong(tokenizer.nextToken());
		long      movieId   = Long.parseLong(tokenizer.nextToken());
		double    rating    = Double.parseDouble(tokenizer.nextToken());
		Timestamp timeStamp = new Timestamp(Long.parseLong(tokenizer.nextToken()));

		Rating aRating = new Rating(rating, timeStamp);

		User user = DataProvider.getInstance().getUsers().get(userId);
		if (user == null) {
			user = new User(userId);
			DataProvider.getInstance().getUsers().put(userId, user);
		}

		Movie movie = DataProvider.getInstance().getMovies().get(movieId);
		movie.addRating(userId, aRating);
	}

	public double getRating() {
		return this.rating;
	}

	public Timestamp getRated() {
		return this.rated;
	}

	@Override
	public String toString() {
		return "Rating [rating=" + this.rating + ", rated=" + this.rated + "]";
	}

}
