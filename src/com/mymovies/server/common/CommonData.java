package com.mymovies.server.common;

import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.logging.Logger;

import com.bilgeadam.boost.course01.mymovies.server.data.Movie;
import com.bilgeadam.boost.course01.mymovies.server.data.Name;
import com.bilgeadam.boost.course01.mymovies.utils.Props;

public class CommonData {
	public static final int                     UNSPECIFIED = -1;
	public static final String                  UNKNOWN     = "";
	private static CommonData                   instance;
	private Logger                              logger;
	private TreeMap<String, Name>               names;
	private TreeMap<String, Movie>              movies;
	private TreeMap<Integer, ArrayList<String>> moviesByYear;
	private boolean                             initializing;
	private LinkedList<String>                  clients;

	private CommonData() {
		super();
	}

	public static CommonData getInstance() {
		if (instance == null) {
			instance = new CommonData();
		}
		return instance;
	}

	public void loadPropertiesFile(String[] args) {
		if (args.length == 0) {
			// programın çalışacağı lokasyonu bulmak için. Her program muhakkak bir Thread
			// i�inde �al���r. Thread'in meta-bilgileri �zerinden nerede
			// �al��t���n� sorgulayabilirsiniz. Sonu�ta ilk arguman olarak
			// server.properties'in path bilgisi ikinci olarak da server.properties ismini
			// veriyoruz
			Props.getInstance().setPropsFilePath(
					Thread.currentThread().getContextClassLoader().getResource("").getPath(), "server.properties");
			this.getLogger().warning("No properties-File defined. Using Default");
		}
		else {
			Props.getInstance().setPropsFilePath(args[0], "server.properties");
			this.getLogger().info("Using given properties-File on <<<" + args[0] + ">>>");
		}
	}

	public void logInfo(String msg) {
		this.getLogger().info(msg);
	}

	public void logWarning(String msg) {
		this.getLogger().warning(msg);
	}

	public void logError(String msg) {
		this.getLogger().severe(msg);
	}

	private Logger getLogger() {
		if (this.logger == null) {
			this.logger = Logger.getLogger("My Movie Server Logger");
			this.logger.setLevel(Props.getInstance().getLogLevel());
		}
		return this.logger;
	}

	public void importData() {
		CommonData.getInstance().getLogger().info("Enter importData()");

		if (this.nameDataExisting())
			this.deserializeNames();
		else {
			this.readNames();
			this.serializeNames();
		}

		if (this.movieDataExisting())
			this.deserializeMovies();
		else {
			this.readMovies();
			this.serializeMovies();
		}
		CommonData.getInstance().getLogger().info("exit importData()");
	}

	private boolean movieDataExisting() {
		File file = new File(Props.getInstance().getMoviesDataFile());
		return file.exists();
	}

	private void readMovies() {
		CommonData.getInstance().getLogger().info("Enter readMovies()");
		Movie.read();
	}

	private void serializeMovies() {
		CommonData.getInstance().logInfo("Enter serializeMovies()");
		try (FileOutputStream fos = new FileOutputStream(Props.getInstance().getMoviesDataFile());
				ObjectOutputStream oos = new ObjectOutputStream(fos);) {

			Set<Map.Entry<String, Movie>> toSerialize = this.getMovies().entrySet();
			for (Map.Entry<String, Movie> entry : toSerialize) {
				entry.getValue().writeExternal(oos);
				oos.flush();
			}
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
		CommonData.getInstance().logInfo("Serialization of movie data ended");
	}

	private void deserializeMovies() {
		CommonData.getInstance().logInfo("Deserializing movies data");
		int movieCount = 0;
		try (FileInputStream fis = new FileInputStream(Props.getInstance().getMoviesDataFile());
				ObjectInputStream ois = new ObjectInputStream(fis);) {

			while (true) {
				Movie movie = new Movie();
				try {
					movie.readExternal(ois);
				}
				catch (EOFException ex) {
					break;
				}
				if (movie.getID() == null || (movie.getID() != null && movie.getID().isEmpty())) {
					break;
				}
				else {
					movieCount++;
					this.addMovie(movie);
				}
			}
		}
		catch (Exception ex) {
			CommonData.getInstance().logError("Read movie count: " + movieCount);
			ex.printStackTrace();
		}
		CommonData.getInstance().logInfo("Deserialization of movie data ended. " + movieCount + " records loaded");
	}

	private void readNames() {
		CommonData.getInstance().getLogger().info("Enter readNames()");
		Name.read();
	}

	private void deserializeNames() {
		CommonData.getInstance().logInfo("Deserializing names data");
		int nameCount = 0;
		try (FileInputStream fis = new FileInputStream(Props.getInstance().getNamesDataFile());
				ObjectInputStream ois = new ObjectInputStream(fis);) {

			while (true) {
				Name name = new Name();
				try {
					name.readExternal(ois);
				}
				catch (EOFException ex) {
					break;
				}
				if (name.getId() == null || (name.getId() != null && name.getId().isEmpty())) {
					break;
				}
				else {
					nameCount++;
					this.getNames().put(name.getPrimaryName(), name);
				}
			}
		}
		catch (Exception ex) {
			System.out.println("Read name count: " + nameCount);
			ex.printStackTrace();
		}
		CommonData.getInstance().logInfo("Deserialization of names data ended. " + nameCount + " records loaded");
	}

	private void serializeNames() {
		CommonData.getInstance().logInfo("Serializing names data");
		try (FileOutputStream fos = new FileOutputStream(Props.getInstance().getNamesDataFile());
				ObjectOutputStream oos = new ObjectOutputStream(fos);) {

			Set<Map.Entry<String, Name>> toSerialize = this.getNames().entrySet();
			for (Map.Entry<String, Name> entry : toSerialize) {
				entry.getValue().writeExternal(oos);
				oos.flush();
			}
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
		CommonData.getInstance().logInfo("Serialization of name data ended");
	}

	private boolean nameDataExisting() {
		File file = new File(Props.getInstance().getNamesDataFile());
		return file.exists();
	}

	public TreeMap<String, Name> getNames() {
		if (this.names == null) {
			this.names = new TreeMap<>();
		}
		return this.names;
	}

	public TreeMap<String, Movie> getMovies() {
		if (this.movies == null) {
			this.movies = new TreeMap<>();
		}
		return this.movies;
	}

	public void addMovie(Movie movie) {
		this.getMovies().put(movie.getID(), movie);  //as�l movie listesi. T�m movie bilgilerini i�eriyor
		this.addMovieToYear(movie);					// y�llara g�re movie'leri grupland�rarak saklad���m�z alternatif liste TreeMap<Integer, ArrayList<String>> 
	}

	private TreeMap<Integer, ArrayList<String>> getMoviesByYear() {
		if (this.moviesByYear == null) {
			this.moviesByYear = new TreeMap<Integer, ArrayList<String>>();
		}
		return this.moviesByYear;
	}
	
	public void addMovieToYear(Movie movie) {
		 ArrayList<String> yearsMovies = this.getMoviesByYear().get(movie.getStartYear());  // lazy get treemap arkas�ndan da get y�l film listesi
		 if (yearsMovies == null) {															// E�ER O YIL ���N H�� F�LM EKLENMED� �SE
			 yearsMovies = new ArrayList<>();												// y�l i�in yeni bo� bir liste olu�turduk
			 this.getMoviesByYear().put(movie.getStartYear(), yearsMovies);					// y�l i�in bo� arraylist'i treemap'e ekledik
		 }
		 yearsMovies.add(movie.getID());													// arraylist'e filmi ekledik
	}
	
	public String getMoviesByYear(int year) {
		ArrayList<String> yearsMovies = this.getMoviesByYear().get(year);
		if (yearsMovies == null) {
			return null;
		}
		StringBuilder builder = new StringBuilder();
		for (String movieId : yearsMovies) {
			builder.append(this.getMovies().get(movieId).getOriginalTitle()).append("|");
		}
		return builder.toString();
	}

	public void addName(Name name) {
		this.getNames().put(name.getPrimaryName(), name);
	}

	public void initializingStarted() {
		this.initializing = true;
	}

	public void initializingStopped() {
		this.initializing = false;
	}

	public boolean isInitializing() {
		return this.initializing;
	}

	public void registerClient(String clientId) {
		this.getClients().add(clientId);
	}

	private LinkedList<String> getClients() {
		if (this.clients == null) {
			this.clients = new LinkedList<String>();
		}
		return this.clients;
	}

	public int numClients() {
		return this.getClients().size();
	}
}
