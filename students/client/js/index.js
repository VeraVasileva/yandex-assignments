/* Application */

var last = 0;

function getFormData(form) {
    return [].reduce.call(
        form.querySelectorAll('input, textarea'),
        (result, formElement) => {
            result[formElement.name] = formElement.value;
            return result;
        }, {}
    );
}

function updateStudentsList(studentsData) {
    const studentsHTML = studentsData.map(renderStudent).join('');

    [].forEach.call(
        document.querySelectorAll('.students__list'),
        (container) => {
            container.innerHTML = studentsHTML;
        }
    );
}

function delegate(containers, selector, event, handler) {
    [].forEach.call(containers, (container) => {
        container.addEventListener(event, function (e) {
            if (e.target.matches(selector)) {
                handler.apply(e.target, arguments);
            }
        });
    });
}

function onStudentAddClick(e) {
    e.preventDefault();

    // this.setAttribute('disabled', 'disabled');

    // getStudentData(this.closest('form'))
    //     .then(addStudent)
    //     .then(() => {
    //         [].forEach.call(
    //             this.closest('form').querySelectorAll('input, textarea'),
    //             (x) => x.value = ''
    //         );
    //     })
    //     .then(getStudents)
    //     .then(updateStudentsList)
    //     .catch((e) => {
    //         if (!(e instanceof ValidationError)) {
    //             console.error(e);
    //             alert('Что-то пошло не так!');
    //         }
    //     });


    getStudentData(this.closest('form'))
        .then((student) => {
            student.div_id = last++;
            document.getElementsByClassName('students__list')[0].innerHTML += renderStudent(student);
            return student;
        })
        .then(addStudent)
        .then((response) => {
            [].forEach.call(
                this.closest('form').querySelectorAll('input, textarea'),
                (x) => x.value = ''
            );
        });


        // .then(() => {
        //     this.removeAttribute('disabled');
        // });
}

function onStudentUpdateClick(e) {
    const studentContainer = this.closest('.student');
    const studentData = studentContainer.dataset.student;
    console.log('updating ', studentData);
    studentContainer.innerHTML = renderStudentForm(JSON.parse(studentData));
}

function onStudentSaveClick(e) {
    e.preventDefault();

    const studentContainer = this.closest('.student');
    const studentData = getFormData(this.closest('form'));

    //this.setAttribute('disabled', 'disabled');

    getStudentData(this.closest('form'))
        
        .then((student) => {
            const newStudentsContainer = document.createElement('div');
            newStudentsContainer.innerHTML = renderStudent(student);
            const newStudentContainer = newStudentsContainer.removeChild(newStudentsContainer.querySelector('.student'));
            const studentsContainer = studentContainer.parentElement;

            studentsContainer.insertBefore(newStudentContainer, studentContainer);
            studentsContainer.removeChild(studentContainer);
            return student;
        })
        .then(updateStudent)
        .catch((e) => {
            if (!(e instanceof ValidationError)) {
                console.error(e);
                alert('Что-то пошло не так!');
            }
        });
        /*.then(() => {
            this.removeAttribute('disabled');
        });*/
}

function renderStudent(student) {
    return `
        <div class="student" data-student='${JSON.stringify(student)}'>
            <div class="student__picture">
                <img src="${student.picSrc}">
            </div>
            <div class="student__info">
                <h2 class="student__name">${student.name}</h2>
                <p class="student__bio">${student.bio}</p>
                <button class="student__update-btn">Изменить</button>
            </div>
        </div>
    `;
}


function getStudentData(form) {
    return new Promise((resolve, reject) => {
        [].forEach.call(form.querySelectorAll('.student-form__field'), (field) => {
            field.classList.remove('student-form__field_error');
        });

        const student = getFormData(form);
        const validationResult = validateStudent(student);

        if (validationResult === true) {
            resolve(student);
        } else {
            form.querySelector('.student-form__field-' + validationResult.prop)
                .classList.add('student-form__field_error');

            reject(validationResult);
        }
    });
}

function validateStudent(student) {
    try {
        validate(student, 'name', 'Не заполнено имя студента');
        validate(student, 'picture', 'Неправильный адрес фотографии студента');
        validate(student, 'bio', 'Не заполнена биография');
    } catch (e) {
        if (e instanceof ValidationError) {
            return e;
        }

        throw e;
    }

    return true;
}

function validate(obj, prop, msg) {
    if (obj.hasOwnProperty(prop) && validators[prop] && !validators[prop](obj[prop], obj)) {
        throw new ValidationError(prop, msg);
    }
}

const validators = {
    name: (value, obj) => {
        return Boolean(value);
    },
    picture: (value, obj) => {
        if (!value) return false;
        if (!/^https?:\/\//.test(value)) return false;
        return true;
    },
    bio: (value, obj) => {
        return Boolean(value);
    }
};

function ValidationError(prop, message) {
  this.name = 'ValidationError';
  this.prop = prop;
  this.message = message || 'Произошла ошибка валидации';
  this.stack = (new Error()).stack;
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

/* API accessors */

function json(response) { 
    return response.json(); 
}

function getStudents() {
    return fetch('/api/v1/students').then(json);
}


// function getStudents() {
//     return fetch('/api/v1/students', {
//         method: 'get',
//         headers: {
//             "Content-type": "application/json; charset=UTF-8"
//         },
//         body: JSON.stringify()
//     }).then(json);
// }

function addStudent(student) {
    return fetch('/api/v1/students', {
        method: 'post',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(student)
    }).then(json);
}

function updateStudent(student) {
    return fetch(`/api/v1/students/${student.id}`, {
        method: 'put',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(student)
    }).then(json);
}

/* Init */

document.addEventListener('DOMContentLoaded', (event) => {
    delegate(
        document.querySelectorAll('.students'),
        '.students__add-btn',
        'click',
        onStudentAddClick
    );

    delegate(
        document.querySelectorAll('.students'),
        '.student__update-btn',
        'click',
        onStudentUpdateClick
    );

    delegate(
        document.querySelectorAll('.students'),
        '.student__save-btn',
        'click',
        onStudentSaveClick
    );

    getStudents().then(updateStudentsList);
});
