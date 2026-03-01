import java.io.*;
import java.net.*;
import java.util.Scanner;

public class ChatClient {
    private static final String SERVER_ADDRESS = "localhost"; // Replace with server IP on LAN
    private static final int PORT = 12345;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter your name: ");
        String clientName = scanner.nextLine(); // Client name entered by the user
        
        try (Socket socket = new Socket(SERVER_ADDRESS, PORT)) {
            System.out.println("Connected to the chat server...");

            // Start a thread to receive messages
            new Thread(new ReceiveMessages(socket)).start();

            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);

            System.out.println("Enter messages to send (type 'exit' to quit):");
            String message;
            while (scanner.hasNextLine()) {
                message = scanner.nextLine();
                if (message.equalsIgnoreCase("exit")) {
                    break;
                }
                // Prefix the client's name to the message
                out.println(clientName + ": " + message);
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
                    System.out.println(message); // Print the received message
                }
            } catch (IOException e) {
                System.out.println("Disconnected from server.");
            }
        }
    }
}
