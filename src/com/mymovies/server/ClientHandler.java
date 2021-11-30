package com.mymovies.server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

import com.bilgeadam.boost.course01.mymovies.server.common.CommonData;
import com.bilgeadam.boost.course01.mymovies.server.data.Movie;
import com.bilgeadam.boost.course01.mymovies.server.data.Name;

public class ClientHandler implements Runnable {
	private final Socket   clientSocket;
	private PrintWriter    out;
	private BufferedReader in;

	public ClientHandler(Socket socket) {
		this.clientSocket = socket;
		this.out          = null;
		this.in           = null;
	}

	public void run() {
		try {

			this.out = new PrintWriter(clientSocket.getOutputStream(), true);
			this.in  = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));

			String line;
			while ((line = in.readLine()) != null) {
				this.processRequest(line);
			}
		}
		catch (IOException e) {
			e.printStackTrace();
		}
		finally {
			try {
				if (out != null) {
					out.close();
				}
				if (in != null) {
					in.close();
					clientSocket.close();
				}
			}
			catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	private void processRequest(String line) {
		line = line.trim();
		if (CommonData.getInstance().isInitializing()) {
			this.out.println("WAIT: Server has not loaded data yet. Please wait..");
		}
		else {
			CommonData.getInstance().logInfo("Received from client: " + line);
			if (line.startsWith("INTR:")) {
				CommonData.getInstance().registerClient(line.substring(5));
				System.out.println("Number of clients connected: " + CommonData.getInstance().numClients());
				this.out.println("Welcome " + line.substring(5));
			}
			else {
				if (line.startsWith("FILMS:")) { // "FILMS:Ingmar Bergman"
					String   actorName = line.substring(6);
					String[] movieIds  = Name.MovieIds(actorName); // tt0050419,tt0031983,tt0053137,tt0072308

					if (movieIds != null) {
						String[] movieTitles = Movie.getMovieTitles(movieIds);
						line = "";
						for (String title : movieTitles) {
							line += title + "|"; // title 1|title 2|....
						}
					}
					else {
						line = "Kay�t bulunamad�";
					}
				}
				else if (line.startsWith("YEAR:")) { // "YEAR:1984
					int year = Integer.parseInt(line.substring(5));
					line = CommonData.getInstance().getMoviesByYear(year);
					if (line == null) {
						line = "Kay�t bulunamad�";
					}
				}
				this.out.println(line);
			}
		}
		this.out.flush();
	}
}
