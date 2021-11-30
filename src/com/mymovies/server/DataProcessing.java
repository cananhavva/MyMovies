package com.mymovies.server;

import com.mymovies.server.common.CommonData;

public class DataProcessing implements Runnable {
	
	public void run() {
		CommonData.getInstance().initializingStarted();
		CommonData.getInstance().importData();
		CommonData.getInstance().initializingStopped();
	}
}
