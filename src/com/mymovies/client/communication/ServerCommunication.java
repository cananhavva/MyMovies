package com.mymovies.client.communication;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class ServerCommunication {
	private PrintWriter    out;
	private BufferedReader in;
	
	public ServerCommunication(Socket socket) {
		super();
		
		try {
			this.out = new PrintWriter(socket.getOutputStream(), true);
			this.in  = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}

	public void introduceClient(String id) throws IOException {
		boolean waitForServer = true;

		while (waitForServer) {
			waitForServer = this.introduce(id);
			if (waitForServer) {
				System.out.println("Sunucu verileri yüklüyor... ");
				try {
					Thread.sleep(10000);
				}
				catch (InterruptedException ex) {
					ex.printStackTrace();
				}
			}
		}
	}
	
	private boolean introduce(String id) throws IOException {
		out.println("INTR:" + id);
		out.flush();
		String answer = in.readLine();
		System.out.println(">>>" + answer);
		if (answer.startsWith("WAIT"))
			return true;
		else
			return false;
	}

	public String askForActorsMovies(String actorName) throws IOException {
		String line = "FILMS:" + actorName;
		out.println(line);
		out.flush();
		return in.readLine();
	}

	public String ask4MoviesInYear(String year) throws IOException {
		String line = "YEAR:" + year;
		out.println(line);
		out.flush();
		return in.readLine();
	}
}
