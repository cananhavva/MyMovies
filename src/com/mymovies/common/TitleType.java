package com.mymovies.common;

public enum TitleType implements Translatable {
	SHORT, MOVIE, TV_EPISODE, TV_MOVIE, TV_MINI_SERIES, TV_SERIES, VIDEO, TV_SPECIAL, VIDEO_GAME, TV_SHORT, 
	TV_PILOT, UNKOWN_TYPE, NOT_SPECIFIED;;
	
	@Override
	public String getI18NKey () {
		return this.getI18NKeyIdentifier() + this.name().toUpperCase(); // TitleType.SHORT
	}
	
	public static TitleType name2TitleType (String name) {
		TitleType titeTypes[] = TitleType.values();
		name = name.trim();
		
		for (TitleType titeType : titeTypes) {
			if (titeType.name().equalsIgnoreCase(name))
				return titeType;
			else {
				if (name.equalsIgnoreCase("tvMovie"))
					return TV_MOVIE;
				else if (name.equalsIgnoreCase("tvEpisode"))
					return TV_EPISODE;
				else if (name.equalsIgnoreCase("TVSERIES"))
					return TV_SERIES;
				else if (name.equalsIgnoreCase("TVMINISERIES"))
					return TV_MINI_SERIES;
				else if (name.equalsIgnoreCase("TVSPECIAL"))
					return TV_SPECIAL;
				else if (name.equalsIgnoreCase("VIDEOGAME"))
					return VIDEO_GAME;
				else if (name.equalsIgnoreCase("TVSHORT"))
					return TV_SHORT;
				else if (name.equalsIgnoreCase("TVPILOT"))
					return TV_PILOT;
				else if (name.equalsIgnoreCase("\\N"))
					return NOT_SPECIFIED;
			}
		}
				
		System.err.println(">>> Bilinmeyen tip bulundu: << " + name + " >>");
		return UNKOWN_TYPE;
	}
}
