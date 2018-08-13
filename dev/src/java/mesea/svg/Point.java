package mesea.svg;

public class Point {

    private double x;
    private double y;
    private double yOrigin;
    protected String color;

    Point(){}

    Point(double X,double Y, double YOrigin){
        x = X;
        y = Y;
        yOrigin = YOrigin;
    }


    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public double getYOrigin() {
        return yOrigin;
    }

    public String getColor() {
        return color;
    }
}
