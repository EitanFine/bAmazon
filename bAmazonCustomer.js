var inquirer = require('inquirer');
var mysql = require('mysql');
var chalk = require('chalk');
var Table = require('cli-table');

const dashes = "---------------------------------------------------------------------------------------------------------------------------------------------------";

// Parameters to connect with DB
var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: "root",
	password: "root",
    database: "bamazon",
    socketPath:"/Applications/MAMP/tmp/mysql/mysql.sock"

});

// Connects SQL DB with Node
connection.connect(function (error) {
	if (error) throw error;
	initialRun();
});




// Display and perform actions
function initialRun() {
	var query = "SELECT * FROM products";

	// Executes query
	connection.query(query, function (error, res) {
		console.log(chalk.green.bold("\nCurrent Products in Bamazon"));
		console.log(chalk.green.bold(dashes));

		// for (var i = 0; i < result.length; i++) {
		// 	console.log(chalk.bold(result[i].item_id + " | ") + result[i].product_name + " ---- $" + chalk.red(result[i].price));
        // }
        
        var table = new Table({
            head: ['ID', 'NAME', 'DEPARTMENT', 'U$', 'Q#'],
            colWidths: [5, 40, 15, 12, 5]
        });


        var prod_arr = []; // Array to hold products info
        prod_arr.length = 0; // Clear array before add the values again


        for(var i=0;i<res.length;i++) {
            table.push([res[i].item_id,res[i].product_name,res[i].department_name,res[i].price.toFixed(2),res[i].stock_quantity]); // Add elements to table
            prod_arr.push([res[i].item_id,res[i].product_name,res[i].department_name,res[i].price,res[i].stock_quantity,res[i].product_sales]); // Add elements to array
        }
        console.log(table.toString()); // Show table
        console.log('');

        // selectProduct(); // Call Function select products

		// console.log(chalk.green(dashes));
		custPurchase();
	});
};

// Customer purchase function
function custPurchase() {
	// Prompts that ask if the customer wants to make a purchase
	inquirer
		.prompt({
			name: "options",
			type: "list",
			message: "Would you like to make a purchase?: ",
			choices: [
				"Yes",
				"No"
			]
		})
		.then(function (answer) {
			// Executes when yes is selected
			if (answer.options === "Yes") {
				// Prompts that ask what item to buy and the number to purchase
				inquirer
					.prompt([
							{
								name: "buyID",
								type: "input",
								message: "Please enter the ID of the product you would like to buy: ",
								validate: function (value) {
									if (isNaN(value) === false) {
											return true;
									}
									return false;
								}
							},
							{
								name: "numUnits",
								type: "input",
								message: "How many would you like to buy?: ",
								validate: function (value) {
									if (isNaN(value) === false)   {
											return true;
									}
									return false;
								}
							}
					])
					.then(function (answer) {
						connection.query("SELECT * FROM products WHERE item_id = ?", [answer.buyID], function (error, result) {
                            if([answer.buyID]<10){
							var currNumItems = result[0].stock_quantity;
							var currItemName = result[0].product_name;
							var currPrice = result[0].price;}

							purchaseItem(currItemName, answer.buyID, answer.numUnits, currNumItems, currPrice);
                        })
                        

					})
			}
			// Terminates the connection since it is not needed anymore	
			else {
				console.log(chalk.green(dashes));
				console.log(chalk.blue("Thank you for your time. Goodbye."));
				connection.end();
			}
	})
}

// Function that takes the selected item and subtracts it from the quantity in the db
function purchaseItem(name, itemNum, units, currUnits, currPrice) {
	var query = "UPDATE products SET ? WHERE ?";
	var newNumUnits = currUnits - units;
	var totalPrice = currPrice * units;

	if (newNumUnits >= 0) {
		connection.query(query, [
			{
				stock_quantity: newNumUnits
			},
			{
				id: itemNum
			}
		], function (error) {
			console.log(chalk.green(dashes));
			console.log(chalk.green("Thanks for the purchase. You have just purchased " + units + " " + name + " for a total of $" + totalPrice + ". There are now " + newNumUnits + " " + name + " remaining."));
			console.log(chalk.green(dashes));

			custPurchase();
		})
	}
	else {
		console.log(chalk.green(dashes));
		console.log(chalk.red("Insufficient quantity! Purchasing of this item is not currently available. Purchasing will be available once product is back in stock."));
		console.log(chalk.green(dashes));

		custPurchase();
	}
}