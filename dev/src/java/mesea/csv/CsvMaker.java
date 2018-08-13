package mesea.csv;

import java.io.*;
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;

public class CsvMaker {

    private FileWriter writer;
    private String fileName;
    private int numCol;
    private static final String DELIMITER = ",";
    private static final String LINE_SEPARATOR = "\n";
    private static final String FIX_HEADER = "Track" + DELIMITER +"Rail";
    private static final int MEASURED_DISTANCE = 20;
    private static final String[] RAILS = {"A", "B"};
    private static final int LINE_NUMBER = 3;
    private static final int[] GRAND_DEVIATION_INTERVAL = {-8, 8};
    private static final int[] MEDIUM_DEVIATION_INTERVAL = {-5, 5};
    private static final int[] SMALL_DEVIATION_INTERVAL = {-2, 2};

     CsvMaker(String fileName, int numCol) {
        this.fileName = fileName;
        this.numCol = numCol;
     }
     private String getHeader() {
        String res = FIX_HEADER;
        int val = 0;
        int i = 0;
        while (i < numCol) {
            val += MEASURED_DISTANCE;
            res = res + DELIMITER + String.valueOf(val);
            i++;
        }
        return res;
     }
     private String getContents(){
         String res = "";

         for (int i = 1; i <= LINE_NUMBER; i++) {
             for (int j = 0; j < RAILS.length; j++) {
                 String line = getLineContent(i, j);
                 res = res + line;
                 res += LINE_SEPARATOR;
             }
         }
        return res;
     }

    private String getLineContent(int lineNumber, int railIndex) {
         String line = "Line" + lineNumber + DELIMITER;
         line += RAILS[railIndex];
         int[] segments = {10,40,60,80,100,130,140,180};
         int val;
         int i = 0;
         while (i < numCol) {
                if (i < segments[0])
                    val = ThreadLocalRandom.current().nextInt(GRAND_DEVIATION_INTERVAL[0], GRAND_DEVIATION_INTERVAL[1]);
                else if(i < segments[1])
                    val = ThreadLocalRandom.current().nextInt(MEDIUM_DEVIATION_INTERVAL[0], MEDIUM_DEVIATION_INTERVAL[1]);
                else if (i < segments[2])
                    val = ThreadLocalRandom.current().nextInt(SMALL_DEVIATION_INTERVAL[0], SMALL_DEVIATION_INTERVAL[1]);
                else if (i < segments[3])
                    val = ThreadLocalRandom.current().nextInt(MEDIUM_DEVIATION_INTERVAL[0], MEDIUM_DEVIATION_INTERVAL[1]);
                else if(i < segments[4])
                    val = ThreadLocalRandom.current().nextInt(SMALL_DEVIATION_INTERVAL[0], SMALL_DEVIATION_INTERVAL[1]);
                else if (i < segments[5])
                    val = ThreadLocalRandom.current().nextInt(SMALL_DEVIATION_INTERVAL[0], SMALL_DEVIATION_INTERVAL[1]);
                else if (i < segments[6])
                    val = ThreadLocalRandom.current().nextInt(GRAND_DEVIATION_INTERVAL[0], GRAND_DEVIATION_INTERVAL[1]);
                else
                    val = ThreadLocalRandom.current().nextInt(MEDIUM_DEVIATION_INTERVAL[0], MEDIUM_DEVIATION_INTERVAL[1]);
            line += DELIMITER + val;
            i++;
        }
         return line;
    }

    public void fill(){
         try {
             writer = new FileWriter(fileName);
             writer.append(getHeader());
             writer.append(LINE_SEPARATOR);
             writer.append(getContents());
         } catch (IOException e) {
             e.printStackTrace();
         } finally {
             try {
                 writer.flush();
                 writer.close();
             } catch (IOException e) {
                 e.printStackTrace();
             }
         }

     }
    public static void main(String[] args) throws IOException {

        if(args.length != 2){
            System.out.println(Arrays.asList(args));
            System.out.println("Expected arguments: [CsvFileName]");
            return;
        }
        String filename = args[0];
        int numCol = Integer.parseInt(args[1]);
        CsvMaker maker = new CsvMaker(filename, numCol);
        maker.fill();
    }
}
