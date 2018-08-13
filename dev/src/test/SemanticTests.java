import odase.FastConfig;
import odase.KnowledgeBase;
import odase.cockpit.SemanticTest;
import org.junit.AfterClass;
import org.junit.Test;

import java.io.File;
import java.util.Arrays;

/**
 * Created by maxime on 21/09/2017.
 */
public class SemanticTests extends SemanticTest {

    public SemanticTests () {
            // XXX conditional ???
        //        jmercury.ont_projects_java_bridge.enablePrevailTTEngineLeanPerformanceTrace("semanticTests.trace.nt");
    }

    KnowledgeBase kb = new KnowledgeBase(
                "stores_catalog.xml","",
                Arrays.asList(
                              "",
                              "rdfstore:rdftrie"
                    ),
            "rdfstore:rdftrie",
                new FastConfig(){

                    @Override
                    public boolean forkOnSubstitutionsForAnyPredicate() {
                        return true;
                    }
                    @Override
                    public int minimumSubstitutions() {
                        return 10;
                    }
                    @Override
                    public int maxForkingDepth() {
                        return 2;
                    }

                    @Override
                    public int substitutionsForkWarmup() {
                        return 2;
                    }

                    @Override
                    public boolean doRemoveRedundantRules() {
                        return true;
                    }
                });

    @Test
    public void test() {
        super.test( new File("test"));
    }


    @Override
    protected KnowledgeBase getKnowledgeBase() {
        return kb;
    }

    @Override
    protected void reportTestFailure(String testName, String message, KnowledgeBase knowledgeBase, File file) {
        org.junit.Assert.fail(testName + ": " + message);
    }

    @AfterClass
    static public void destroy() {
        // jmercury.ont_projects_java_bridge.closePrevailTTEngineTraceFile();
        // jmercury.ont_projects_java_bridge.disablePrevailTTEngineTrace();
    }

}
