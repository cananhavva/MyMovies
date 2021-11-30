package com.mymovies.common;

public enum Genre implements Translatable {
	Documentary, Short, Animation, Comedy, Romance, Sport, News, Drama, Fantasy, Horror, Music, Musical, Thriller,
	Western, FilmNoir, Crime, War, Adventure, Family, History, Action, Mystery, Biography, SciFi, TalkShow, Adult,
	GameShow, Children, RealityTV, UNKOWN_TYPE, NOT_SPECIFIED;

	@Override
	public String getI18NKey() {
		return this.getI18NKeyIdentifier() + this.name().toUpperCase();
	}

	public static Genre name2Genre(String name) {
		Genre genres[] = Genre.values();
		name = name.trim();

		for (Genre genre : genres) {
			if (genre.name().equalsIgnoreCase(name))
				return genre;
			else {
				if (name.equalsIgnoreCase("Sci-Fi"))
					return SciFi;
				else if (name.equalsIgnoreCase("Film-Noir"))
					return FilmNoir;
				else if (name.equalsIgnoreCase("Talk-Show"))
					return TalkShow;
				else if (name.equalsIgnoreCase("Game-Show"))
					return GameShow;
				else if (name.equalsIgnoreCase("Reality-TV"))
					return RealityTV;
				else if (name.equalsIgnoreCase("\\N"))
					return NOT_SPECIFIED;
			}
		}

		System.err.println(">>> Bilinmeyen tip bulundu: << " + name + " >>");
		return UNKOWN_TYPE;
	}
}
