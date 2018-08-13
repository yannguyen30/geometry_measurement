
if(typeof importPackage != "undefined")
{
    importPackage(Packages.javax.swing);
    importPackage(Packages.java.io);
    function pick_file_and_save(content)
    {
        try
        {
            var fc = new JFileChooser();
            fc.showSaveDialog(null);
            var selFile = fc.getSelectedFile();
            var out = new PrintWriter(new FileWriter(selFile));
            out.print(content);
            out.close();
        } catch(e)
        {
            alert("Saving file under Batik requires privileges, to grant it go to 'Edit' -> 'Preferences' -> 'Security'  and untick 'Enforce secure scripting'.");
        }
    }
}

