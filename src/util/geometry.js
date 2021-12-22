import Directions from 'util/directions'


// Helper function to get the vertices one side of a block

export const getVerticesForSide = ({ x, y, z }, direction) => {
    if (direction === Directions.UP)
        return [x, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y + 1, z,
                x, y + 1, z,  x, y + 1, z + 1,      x + 1, y + 1, z + 1]
    else if (direction === Directions.DOWN)
        return [x, y, z,      x + 1, y, z,          x + 1, y, z + 1,
                x, y, z,      x + 1, y, z + 1,      x, y, z + 1]
    else if (direction === Directions.NORTH)
        return [x, y, z + 1,  x + 1, y, z + 1,      x + 1, y + 1, z + 1,
                x, y, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z + 1]
    else if (direction === Directions.SOUTH)
        return [x, y, z,      x + 1, y + 1, z,      x + 1, y, z,
                x, y, z,      x, y + 1, z,          x + 1, y + 1, z]
    else if (direction === Directions.WEST)
        return [x + 1, y, z,  x + 1, y + 1, z + 1,  x + 1, y, z + 1,
                x + 1, y, z,  x + 1, y + 1, z,      x + 1, y + 1, z + 1]
    else if (direction === Directions.EAST)
        return [x, y, z,      x, y, z + 1,          x, y + 1, z + 1,
                x, y, z,      x, y + 1, z + 1,      x, y + 1, z] }
