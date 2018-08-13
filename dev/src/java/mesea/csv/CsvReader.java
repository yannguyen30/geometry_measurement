package mesea.csv;


import mesea.model.BusinessModel;
import odase.FastConfig;
import odase.KnowledgeBase;
import odase.Ontology;
import odase.utils.CommonNamespaces;
import odase.utils.URIPrefix;
import odase.w3onts.Owl;

import java.io.*;

import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.*;

import java.util.List;

import mesea.model.TrackMaintenance;

public class CsvReader {
    String inputPath ;
    String outputPath;
    String outputURI ;

    BusinessModel businessModel;
    private final static String CATALOG = "catalog.xml";
    private static final String DELIMITER = ",";
    private static final int START_INDEX = 2;
    private static final int TRACK_ID = 0;
    private static final int RAIL_ID = 1;
    private String[] measuredDistance;
    public CsvReader(String[] args){
        this.inputPath = args[0];
        this.outputPath = args[1];
        this.outputURI = args[2];

    }

    public void read() {
        KnowledgeBase kb = new KnowledgeBase(
                CATALOG,"",
                Arrays.asList("http://www.mesea.fr/onto-maintenance/ontologies/main/businessModel.owl",
                        "rdfstore:rdftrie"),
                "rdfstore:rdftrie",
                new FastConfig());
        try {
            BufferedReader fileReader = new BufferedReader(new FileReader(inputPath));
            businessModel = new BusinessModel(kb);
            measuredDistance = fileReader.readLine().split(DELIMITER);
            String lineString;

            while ((lineString = fileReader.readLine()) != null) {
                String[] line = lineString.split(DELIMITER);
                readLine(line);
            }

            Owl owl = new Owl(kb);
            Owl.Ontology ontology = owl.assertOntology(outputURI);
            /* import the model */
            ontology.getImports().add(owl.newOntology("http://www.mesea.fr/onto-maintenance/ontologies/main/businessModel.owl"));
            /* create the output file */
            PrintWriter outputFile = new PrintWriter(outputPath, "UTF-8");
            /* add prefix and individus into output file*/
            kb.getRdfDataStore(kb.getUpdateableStoreId()).writeAsXMLFast(outputFile, outputURI,
                    Arrays.asList(
                            new URIPrefix(CommonNamespaces.OWL, "owl"),
                            new URIPrefix("http://www.mesea.fr/onto-maintenance/ontologies/main/businessModel.owl#", "bm"),
                            new URIPrefix(outputURI+"#", "")
                    ));
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    private BusinessModel.Track createTrack(String[] line) {
        return businessModel.assertTrack(outputURI + "#" + line[TRACK_ID]);
    }
    private BusinessModel.Rail createRail(String[] line) {
        return businessModel.assertRail(outputURI + "#" + line[TRACK_ID] + "_" + line[RAIL_ID]);
    }
    private void createTrackRailProperty(BusinessModel.Track track, BusinessModel.Rail rail){
        track.getComposedOfRail().add(rail);
    }
    private BusinessModel.Measurement createMeasurement(String[] line, int index) {
        return businessModel.assertMeasurement(outputURI + "#"
                + line[TRACK_ID] + "_"
                + line[RAIL_ID] + "_"
                + measuredDistance[index] + "_"
                + line[index]);
    }
    private void createRailMeasurementProperty(BusinessModel.Rail rail, BusinessModel.Measurement measurement) {
        rail.getHasMeasurement().add(measurement);
        //This code will not trigger as at this time, degradation is unknown yet
        if (measurement.isDegradationPoint()) {
            rail.getHasDegradationPoint().add(measurement.asDegradationPoint());
        }
    }

    private void setMeasurementProperties(BusinessModel.Measurement measurement, int deviationValue, int distance) {
        measurement.setDeviationValue(deviationValue);
        measurement.setDistance(distance);
    }
    private void setFollowedByMeasurementProperty(BusinessModel.Measurement one, BusinessModel.Measurement two) {
        one.setFollowedByMeasurement(two);
    }
    private void readLine(String[] line) {
        BusinessModel.Track track = createTrack(line);
        BusinessModel.Rail rail = createRail(line);
        createTrackRailProperty(track, rail);
        BusinessModel.Measurement previous = null;

        for (int i = START_INDEX; i < line.length; i++) {
            BusinessModel.Measurement measurement = createMeasurement(line, i);
            createRailMeasurementProperty(rail, measurement);
            setMeasurementProperties(measurement,Integer.parseInt(line[i]), Integer.parseInt(measuredDistance[i]));
            if (previous != null)
                setFollowedByMeasurementProperty(previous, measurement);
            previous = measurement;
        }
    }
    /*
    Opens the message provided in the input, calls the parse method on it and puts the result in a generated ontology.
    */
    public static void main(String[] args) throws IOException {
        /*
        args = new String[3];
        args[0] = "data/mockTestData.csv";
        args[1] = "ontologies/main/modelWithData.owl";
        args[2] = "http://www.mesea.fr/onto-maintenance/ontologies/main/modelWithData.owl";
        */
        //Verify correct number of inputs

        if(args.length != 3){
            System.out.println(Arrays.asList(args));
            System.out.println("Expected arguments: [dataFile] [outputFile] [outputURI]");
            return;
        }

        CsvReader csvReader = new CsvReader(args);
        csvReader.read();



    }




}
