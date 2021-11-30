package com.mymovies.server;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

import com.bilgeadam.boost.course01.mymovies.server.common.CommonData;
import com.bilgeadam.boost.course01.mymovies.utils.Props;

public class MyMovieServer {

	public static void main(String[] args) {

		CommonData.getInstance().loadPropertiesFile(args);

		(new MyMovieServer()).start();
	}

	private void start() {
		CommonData.getInstance().logInfo("Server starting ...");

		// (1) e�er gerekli ise TSV'lerden verileri okuyacak, parse edecek ve seriyalize
		// edecek, yoksa do�rudan verileri deserialize edecek
		new Thread(new DataProcessing()).start();

		// (2) client'lar ile ileti�im kurup gelen sorular� yan�tlayacak
		this.startServer(); // client'lar ile ileti�im

		CommonData.getInstance().logInfo("Server stopped");
	}

	private void startServer() {
		try (ServerSocket server = new ServerSocket(Props.getInstance().getServerPort());) {
			server.setReuseAddress(true); // port'u bir �ok client'�n kullanabilece�i �ekilde ayarla.
			CommonData.getInstance().logInfo("Server started and waiting for clients...");
			while (true) {
				Socket client = server.accept();
				CommonData.getInstance().logInfo("New client connected " + client.getInetAddress().getHostAddress());
				ClientHandler clienthandler = new ClientHandler(client); // create a new thread object her yeni ba�lant�
																			// iste�i geldi�inde bir clientHandle
																			// olu�turuyor
				new Thread(clienthandler).start(); // This thread will handle the client separately ve onu yeni bir
													// thread i�inde �al��t�r�yor
			}
		}
		catch (IOException ex) {
			// TODO Auto-generated catch block
			ex.printStackTrace();
		}
	}
}
