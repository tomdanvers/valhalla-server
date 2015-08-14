module.exports = {
    firstNamesMale: ['Ragnar', 'Olaf', 'Snorri', 'Magnus'],
    lastNamesMale: ['Storm', 'Magnusson', 'Sturluson', 'Loftsson'],
    firstNamesFemale: ['Hjordis', 'Herdís', 'Blenda', 'Freyja', 'Irpa', 'Brunhild'],
    lastNamesFemale: ['Magnusdottir', 'Storm', 'Kraki', 'Jónsdóttir'],
    getRandomCharacter: function() {
        var first;
        var last;
        if (Math.random() > .5) {
            first = this.randomItem(this.firstNamesMale);
            last = this.randomItem(this.lastNamesMale);
            return {
                firstName: first,
                lastName: last,
                name: first + ' ' + last,
                gender: 'male'
            };
        } else {
            first = this.randomItem(this.firstNamesFemale);
            last = this.randomItem(this.lastNamesFemale);
            return {
                firstName: first,
                lastName: last,
                name: first + ' ' + last,
                gender: 'female'
            };
        }
    },
    randomItem: function(array) {
        return array[Math.floor(Math.random() * array.length)]
    }
}
