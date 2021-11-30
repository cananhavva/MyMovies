package com.mymovies.server.data;

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.Externalizable;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;
import java.util.Arrays;
import java.util.StringTokenizer;

import com.bilgeadam.boost.course01.mymovies.common.Genre;
import com.bilgeadam.boost.course01.mymovies.common.TitleType;
import com.bilgeadam.boost.course01.mymovies.server.common.CommonData;
import com.bilgeadam.boost.course01.mymovies.utils.Props;

public class Movie implements Externalizable {
	private static final long serialVersionUID = 1234567892L;
	public static final short UNSPECIFIED      = -1;
	private String            imdbId;
	private TitleType         titleType;
	private String            originalTitle;
	private boolean           adultMovie;
	private int               startYear;
	private int               endYear;
	private int               runtimeMinutes;
	private Genre[]           genres;

	public Movie() {
		super();
	}

	private static Movie parse(String line) {
		Movie movie = new Movie();

		StringTokenizer tokenizer = new StringTokenizer(line, "\t");
		movie.imdbId    = tokenizer.nextToken();
		movie.titleType = TitleType.name2TitleType(tokenizer.nextToken());
		tokenizer.nextToken(); // over primaryTitle
		movie.originalTitle = tokenizer.nextToken();
		movie.adultMovie    = tokenizer.nextToken().equals("1");

		String token = tokenizer.nextToken();
		if (token.equalsIgnoreCase("\\N")) {
			movie.endYear = UNSPECIFIED;
		}
		else {
			movie.startYear = Integer.parseInt(token);
		}

		token = tokenizer.nextToken();
		if (token.equalsIgnoreCase("\\N")) {
			movie.endYear = UNSPECIFIED;
		}
		else {
			movie.endYear = Integer.parseInt(token);
		}

		token = tokenizer.nextToken();
		if (token.equalsIgnoreCase("\\N")) {
			movie.runtimeMinutes = UNSPECIFIED;
		}
		else {
			movie.runtimeMinutes = Integer.parseInt(token);
		}

		token = tokenizer.nextToken();
		StringTokenizer genreTokens = new StringTokenizer(token, ",");
		int             numGenres   = genreTokens.countTokens();
		movie.genres = new Genre[numGenres];
		for (int i = 0; i < numGenres; i++) {
			movie.genres[i] = Genre.name2Genre(genreTokens.nextToken());
		}

		return movie;
	}

	public static void read() {
		CommonData.getInstance().logInfo(("Reading movies data"));

		File file = new File(Props.getInstance().getMoviesTSVFile());

		int movieCnt = 0;
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {

			while (true) {
				String line;
				try {
					line = bR.readLine();
					if (line == null) {
						break;
					}
					if (line.startsWith("tconst")) {
						continue;
					}
					Movie movie = Movie.parse(line);
					movieCnt++;
					CommonData.getInstance().addMovie(movie);
				}
				catch (Error err) {
					System.out.println(movieCnt);
					err.printStackTrace();
				}
				catch (IOException ex) {
					System.out.println(movieCnt);
					ex.printStackTrace();
				}
				catch (Throwable t) {
					System.out.println(movieCnt);
					t.printStackTrace();
				}
			}
		}
		catch (IOException ex) {
			CommonData.getInstance().logError(ex.getMessage());
		}
		CommonData.getInstance().logInfo(movieCnt + " records read from movies data");
	}

	public String getID() {
		return this.imdbId;
	}

	public static short getUnspecified() {
		return UNSPECIFIED;
	}

	public TitleType getTitleType() {
		return this.titleType;
	}

	public String getOriginalTitle() {
		return this.originalTitle;
	}

	public boolean isAdultMovie() {
		return this.adultMovie;
	}

	public int getStartYear() {
		return this.startYear;
	}

	public int getEndYear() {
		return this.endYear;
	}

	public int getRuntimeMinutes() {
		return this.runtimeMinutes;
	}

	public Genre[] getGenres() {
		return this.genres;
	}

	@Override
	public String toString() {
		return "Movie [imdbId=" + this.imdbId + ", titleType=" + this.titleType + ", originalTitle="
				+ this.originalTitle + ", adultMovie=" + this.adultMovie + ", startYear=" + this.startYear
				+ ", endYear=" + this.endYear + ", runtimeMinutes=" + this.runtimeMinutes + ", genres="
				+ Arrays.toString(this.genres) + "]";
	}

	public static String getFilePath() {
		return Props.getInstance().getMoviesTSVFile();
	}

	public static String getDataPath() {
		return Props.getInstance().getMoviesDataFile();
	}

	@Override
	public void writeExternal(ObjectOutput out) throws IOException {
		out.writeUTF(imdbId);
		out.writeUTF(titleType.name()); // ==> DOCUMENTARY enumu'u DOCUMENTARY String'e �eviriyor
		out.writeUTF(originalTitle);
		out.writeBoolean(adultMovie);
		out.writeInt(startYear);
		out.writeInt(endYear);
		out.writeInt(runtimeMinutes);
		out.writeInt(genres.length);
		for (Genre genre : genres) {
			out.writeUTF(genre.name());
		}
	}

	@Override
	public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException, EOFException {

		this.imdbId         = in.readUTF();
		this.titleType      = TitleType.valueOf(in.readUTF());
		this.originalTitle  = in.readUTF();
		this.adultMovie     = in.readBoolean();
		this.startYear      = in.readInt();
		this.endYear        = in.readInt();
		this.runtimeMinutes = in.readInt();
		this.genres         = new Genre[in.readInt()];
		for (int i = 0; i < this.genres.length; i++) {
			this.genres[i] = Genre.valueOf(in.readUTF()); // ==> DOCUMENTARY String'ini DOCUMENTARY enum'una �eviriyor
		}
	}

	public static String[] getMovieTitles(String[] movieIds) {

		String[] retVal = null;
		if (movieIds.length > 0) {
			retVal = new String[movieIds.length];
			for (int i=0; i < movieIds.length; i++ ) {
				retVal[i] = Movie.getName(movieIds[i]);
			}
		}
		return retVal;
	}

	private static String getName(String movieId) {
		return CommonData.getInstance().getMovies().get(movieId).getOriginalTitle();
	}
}
