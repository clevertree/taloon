import React from "react";
import {StyleSheet, View} from "react-native";


class MenuBreak extends React.Component {
    render() {
        return (
            <View style={styles.break}/>
        );
    }
}

export default MenuBreak;


const styles = StyleSheet.create({

    break: {
        borderBottomColor: 'black',
        borderBottomWidth: 1,
    }

});
