import java.io.*;
import java.net.*;
import java.util.Scanner;

public class ChatClient {
    private static final String SERVER_ADDRESS = "localhost"; // Replace with server IP on LAN
    private static final int PORT = 12345;

    public static void main(String[] args) {
        try (Socket socket = new Socket(SERVER_ADDRESS, PORT)) {
            System.out.println("Connected to the chat server...");

            new Thread(new ReceiveMessages(socket)).start();

            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            Scanner scanner = new Scanner(System.in);

            System.out.println("Enter messages to send (type 'exit' to quit):");
            String message;
            while (scanner.hasNextLine()) {
                message = scanner.nextLine();
                if (message.equalsIgnoreCase("exit")) {
                    break;
                }
                out.println(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static class ReceiveMessages implements Runnable {
        private Socket socket;

        public ReceiveMessages(Socket socket) {
            this.socket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
                String message;
                while ((message = in.readLine()) != null) {
                    System.out.println("Server: " + message);
                }
            } catch (IOException e) {
                System.out.println("Disconnected from server.");
            }
        }
    }
}
