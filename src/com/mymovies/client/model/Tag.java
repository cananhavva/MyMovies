package com.mymovies.client.model;

import java.sql.Timestamp;
import java.util.StringTokenizer;

import com.bilgeadam.boost.course01.mymovies.client.common.DataProvider;

public class Tag {
	private static long tagCount = 1;
	private long        id;
	private String      tag;

	public Tag(String tag) {
		this.id  = tagCount++;
		this.tag = tag;
	}

	public long getId() {
		return this.id;
	}

	public String getTag() {
		return this.tag;
	}

	@Override
	public String toString() {
		return "Tag [id=" + this.id + ", tag=" + this.tag + "]";
	}

	public static void parse(String line) {
		StringTokenizer tokenizer = new StringTokenizer(line, ",");
//		userId,movieId,tag,timestamp
//		2,60756,funny,1445714994

		long      userId    = Long.parseLong(tokenizer.nextToken());
		long      movieId   = Long.parseLong(tokenizer.nextToken());
		String    tagName   = tokenizer.nextToken().trim().toUpperCase();
		Timestamp timeStamp = new Timestamp(Long.parseLong(tokenizer.nextToken()));

		User user = DataProvider.getInstance().getUsers().get(userId);
		if (user == null) {
			user = new User(userId);
			DataProvider.getInstance().getUsers().put(userId, user);
		}

		Tag tag = DataProvider.getInstance().getTags().get(tagName);
		if (tag == null) {
			tag = new Tag(tagName);
			DataProvider.getInstance().getTags().put(tagName, tag);
		}

		Movie movie = DataProvider.getInstance().getMovies().get(movieId);
		movie.addTag(tag, timeStamp, userId);
	}

}
